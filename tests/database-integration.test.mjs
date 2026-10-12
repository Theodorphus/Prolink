import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const customer = '11111111-1111-4111-8111-111111111111'
const provider = '22222222-2222-4222-8222-222222222222'
const outsider = '33333333-3333-4333-8333-333333333333'

test('real PostgreSQL migration replay and marketplace authorization', async t => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
    create function uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  `)
  for (const name of (await readdir(new URL('../supabase/migrations/', import.meta.url))).sort()) {
    let sql = await readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8')
    // PGlite has built-in UUID generation; Supabase's publication is infrastructure.
    sql = sql.replace(/create extension if not exists "uuid-ossp";/g, '').replace(/alter publication supabase_realtime add table [^;]+;/g, '')
    try { await db.exec(sql) } catch (error) { throw new Error(`Migration ${name}: ${error.message}`) }
  }
  await db.query(`insert into auth.users values ($1, '{"name":"Customer","role":"customer"}'), ($2, '{"name":"Provider","role":"provider"}'), ($3, '{"name":"Outsider","role":"provider"}')`, [customer, provider, outsider])
  async function as(id, sql, values = []) {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', 'authenticated', false)`, [id])
    await db.exec('set role authenticated')
    try { return await db.query(sql, values) } finally { await db.exec('reset role') }
  }
  const job = (await as(customer, `insert into jobs(customer_id,title,description,category) values ($1,'Test request','A sufficiently long description','webbutveckling') returning id`, [customer])).rows[0].id
  const offer = (await as(provider, `insert into offers(job_id,provider_id,price,timeline,description) values ($1,$2,100,'Two days','A sufficiently long offer') returning id`, [job,provider])).rows[0].id
  await t.test('outsider cannot exploit idempotent transition', async () => {
    await assert.rejects(as(outsider, `select transition_offer($1,'pending')`, [offer]), { code: '42501' })
    assert.equal((await as(provider, `select (transition_offer($1,'pending')).id`, [offer])).rows[0].id, offer)
  })
  await t.test('participants alone can complete and review a transaction', async () => {
    await assert.rejects(as(provider, `select transition_offer($1,'accepted')`, [offer]), { code: '42501' })
    await as(customer, `select transition_offer($1,'accepted')`, [offer])
    await as(provider, `select transition_offer($1,'delivered')`, [offer])
    await as(customer, `select transition_offer($1,'completed')`, [offer])
    await as(customer, `insert into reviews(offer_id,reviewer_id,reviewee_id,rating) values ($1,$2,$3,5)`, [offer,customer,provider])
    await assert.rejects(as(outsider, `insert into reviews(offer_id,reviewer_id,reviewee_id,rating) values ($1,$2,$3,1)`, [offer,outsider,provider]))
    await assert.rejects(as(customer, `update jobs set status='open' where id=$1`, [job]), { code:'23514' })
  })
  await t.test('archiving preserves offer, review and messages; hard deletion is denied', async () => {
    await as(provider, `insert into messages(offer_id,sender_id,content) values ($1,$2,'Hello')`, [offer,provider])
    await assert.rejects(as(customer, `delete from jobs where id=$1`, [job]), { code:'42501' })
    await assert.rejects(as(outsider, `select archive_job($1)`, [job]), { code:'42501' })
    await as(customer, `select archive_job($1)`, [job])
    assert.equal((await db.query('select count(*)::int as n from offers where id=$1',[offer])).rows[0].n,1)
    assert.equal((await db.query('select count(*)::int as n from messages where offer_id=$1',[offer])).rows[0].n,1)
    assert.equal((await db.query('select count(*)::int as n from reviews where offer_id=$1',[offer])).rows[0].n,1)
  })
  await t.test('targeted request is private and cannot be retargeted', async () => {
    const privateJob = (await as(customer, `insert into jobs(customer_id,requested_provider_id,title,description,category) values ($1,$2,'Private request','A private request description','webbutveckling') returning id`,[customer,provider])).rows[0].id
    assert.equal((await as(outsider,'select id from jobs where id=$1',[privateJob])).rows.length,0)
    assert.equal((await as(provider,'select id from jobs where id=$1',[privateJob])).rows.length,1)
    // Kolumnen går inte att uppdatera alls sedan 023; triggern är andra linjen.
    await assert.rejects(as(customer,'update jobs set requested_provider_id=$1 where id=$2',[outsider,privateJob]),{code:'42501'})
    await assert.rejects(as(outsider,`insert into offers(job_id,provider_id,price,timeline,description) values ($1,$2,100,'Two days','A sufficiently long offer')`,[privateJob,outsider]))
  })
  await t.test('direct writes obey database quota; reads do not consume it', async () => {
    for(let i=0;i<10;i++) await as(outsider,`insert into services(provider_id,title,description,price,delivery_time,category) values ($1,'Test service','A valid service description',100,'Two days','webbutveckling')`,[outsider])
    await assert.rejects(as(outsider,`insert into services(provider_id,title,description,price,delivery_time,category) values ($1,'Test service','A valid service description',100,'Two days','webbutveckling')`,[outsider]),{code:'54000'})
    const before=(await db.query(`select used from write_quotas where subject=$1 and action='messages'`,[provider])).rows[0].used
    for(let i=0;i<70;i++) await as(provider,'select id from messages where offer_id=$1',[offer])
    assert.equal((await db.query(`select used from write_quotas where subject=$1 and action='messages'`,[provider])).rows[0].used,before)
  })
  await t.test('outbox persists, deduplicates chat notices, and leases atomically',async()=>{
    await as(provider,`insert into messages(offer_id,sender_id,content) values ($1,$2,'Another message')`,[offer,provider])
    assert.equal((await db.query(`select count(*)::int as n from notification_outbox where kind='message'`)).rows[0].n,1)
    await assert.rejects(as(outsider,'select * from claim_notifications()'),{code:'42501'})
    const first=await db.query('select id from claim_notifications()')
    const second=await db.query('select id from claim_notifications()')
    assert.ok(first.rows.length>0)
    assert.ok(!second.rows.some(b=>first.rows.some(a=>a.id===b.id)))
  })
  await t.test('rating summary covers all reviews, not the displayed three', async () => {
    for (let i=0;i<4;i++) {
      const j=(await as(customer, `insert into jobs(customer_id,title,description,category) values ($1,'Review job','A sufficiently long description','webbutveckling') returning id`,[customer])).rows[0].id
      const o=(await as(provider, `insert into offers(job_id,provider_id,price,timeline,description) values ($1,$2,100,'Two days','A sufficiently long offer') returning id`,[j,provider])).rows[0].id
      await as(customer, `select transition_offer($1,'accepted')`,[o])
      await as(provider, `select transition_offer($1,'delivered')`,[o])
      await as(customer, `select transition_offer($1,'completed')`,[o])
      await as(customer, `insert into reviews(offer_id,reviewer_id,reviewee_id,rating) values($1,$2,$3,1)`,[o,customer,provider])
    }
    const summary=(await as(outsider,'select * from review_summary($1)',[provider])).rows[0]
    assert.equal(Number(summary.total),5)
    assert.equal(Number(summary.average),1.8)
  })
  await t.test('conversation listing cannot expose another pair and reports unread messages',async()=>{
    const mine=(await as(customer,'select * from conversation_list(1)')).rows
    assert.ok(mine.some(row=>row.id===offer && row.unread))
    assert.equal((await as(outsider,'select * from conversation_list(1)')).rows.length,0)
    assert.ok((await as(customer,'select unread_count() as n')).rows[0].n>=1)
    assert.equal((await as(outsider,'select unread_count() as n')).rows[0].n,0)
    // Att öppna offerten tar bort "ny offert" men markerar inte meddelanden
    // som skickats efter offerten som lästa.
    await as(customer,'select mark_offer_read($1)',[offer])
    const latest=(await db.query('select id from messages where offer_id=$1 and sender_id<>$2 order by created_at desc,id desc limit 1',[offer,customer])).rows[0]
    if (latest) {
      assert.equal((await as(customer,'select * from conversation_list(1)')).rows.find(row=>row.id===offer).unread,true)
      await as(customer,'select mark_conversation_read($1,$2)',[offer,latest.id])
    }
    const row=(await as(customer,'select * from conversation_list(1)')).rows.find(row=>row.id===offer)
    assert.equal(row.unread,false)
    assert.equal(row.is_customer,true)
    assert.ok(Number(row.price)>0)
  })
  await t.test('a new offer is unread for the customer until opened',async()=>{
    const j=(await as(customer, `insert into jobs(customer_id,title,description,category) values ($1,'Unread offer job','A sufficiently long description','webbutveckling') returning id`,[customer])).rows[0].id
    const o=(await as(provider, `insert into offers(job_id,provider_id,price,description,timeline) values ($1,$2,1500,'A sufficiently long offer description','1 vecka') returning id`,[j,provider])).rows[0].id
    const before=(await as(customer,'select unread_count() as n')).rows[0].n
    assert.equal((await as(customer,'select * from conversation_list(1)')).rows.find(row=>row.id===o).unread,true)
    assert.equal((await as(provider,'select * from conversation_list(1)')).rows.find(row=>row.id===o).unread,false)
    await as(customer,'select mark_offer_read($1)',[o])
    assert.equal((await as(customer,'select * from conversation_list(1)')).rows.find(row=>row.id===o).unread,false)
    assert.equal((await as(customer,'select unread_count() as n')).rows[0].n,before-1)
  })
  await t.test('read receipts acknowledge fetched messages only and never move backwards', async () => {
    await db.query('update offers set customer_read_at=null where id=$1', [offer])
    const first = (await as(provider, `insert into messages(offer_id,sender_id,content,created_at) values ($1,$2,'First','2026-09-22T10:00:00.123456Z') returning id`, [offer,provider])).rows[0].id
    const second = (await as(provider, `insert into messages(offer_id,sender_id,content,created_at) values ($1,$2,'Second','2026-09-22T10:00:00.123457Z') returning id`, [offer,provider])).rows[0].id
    await assert.rejects(as(outsider, 'select mark_conversation_read($1,$2)', [offer, first]), {code:'42501'})
    await assert.rejects(as(customer, 'select mark_conversation_read($1,$2)', [offer, outsider]), {code:'P0002'})
    await as(customer, 'select mark_conversation_read($1,$2)', [offer, first])
    assert.equal((await db.query('select messages.created_at > customer_read_at as unread from messages join offers on offers.id=messages.offer_id where messages.id=$1', [second])).rows[0].unread, true)
    await as(customer, 'select mark_conversation_read($1,$2)', [offer, second])
    await as(customer, 'select mark_conversation_read($1,$2)', [offer, first])
    assert.equal((await db.query('select messages.created_at = customer_read_at as acknowledged from messages join offers on offers.id=messages.offer_id where messages.id=$1', [second])).rows[0].acknowledged, true)
  })
  await t.test('notification settings exclude non-matching categories',async()=>{
    await as(outsider, `update user_private_profiles set notification_categories=array['juridik'] where user_id=$1`,[outsider])
    const j=(await as(customer, `insert into jobs(customer_id,title,description,category) values ($1,'Category job','A sufficiently long description','webbutveckling') returning id`,[customer])).rows[0].id
    assert.equal((await db.query(`select count(*)::int as n from notification_outbox where recipient_id=$1 and path=$2`,[outsider,'/jobs/'+j])).rows[0].n,0)
    await assert.rejects(as(customer,`update user_private_profiles set email_jobs=false where user_id=$1 returning user_id`,[outsider]).then(result=> { assert.equal(result.rows.length,1) }))
  })
  await t.test('every offer outcome notifies the party who acts next', async () => {
    const j = (await as(customer, `insert into jobs(customer_id,title,description,category) values ($1,'Outcome job','A sufficiently long description','webbutveckling') returning id`, [customer])).rows[0].id
    const winner = (await as(provider, `insert into offers(job_id,provider_id,price,timeline,description) values ($1,$2,100,'Two days','A sufficiently long offer') returning id`, [j, provider])).rows[0].id
    const loser = (await as(outsider, `insert into offers(job_id,provider_id,price,timeline,description) values ($1,$2,90,'One day','Another sufficiently long offer') returning id`, [j, outsider])).rows[0].id
    const notices = async id => (await db.query('select kind, recipient_id from notification_outbox where path=$1', ['/offers/' + id])).rows.map(n => `${n.kind}:${n.recipient_id}`).sort()
    // Accepting one offer rejects the others automatically; their providers must hear about it.
    await as(customer, `select transition_offer($1,'accepted')`, [winner])
    assert.deepEqual(await notices(loser), [`offer:${customer}`, `rejected:${outsider}`])
    await as(provider, `select transition_offer($1,'delivered')`, [winner])
    await as(customer, `select transition_offer($1,'completed')`, [winner])
    const expected = [`accepted:${provider}`, `completed:${provider}`, `delivered:${customer}`, `offer:${customer}`]
    assert.deepEqual(await notices(winner), expected)
    // Read receipts update the offer without changing status and must not queue anything.
    await db.query('update offers set provider_read_at = now(), customer_read_at = now() where id=$1', [winner])
    assert.deepEqual(await notices(winner), expected)
  })

  await t.test('company verification is private until an admin verifies it', async () => {
    await assert.rejects(as(customer, `select submit_company_verification('5560360793','Kundens AB',true)`), { code: '42501' })
    await as(provider, `select submit_company_verification('5560360793','Leverantören AB',true)`)
    await assert.rejects(as(provider, 'select * from company_verifications'))
    await assert.rejects(as(provider, `update company_verifications set status='verified'`))
    assert.equal((await as(outsider, 'select * from company_badge($1)', [provider])).rows.length, 0)
    assert.equal((await as(provider, 'select status from my_company_verification()')).rows[0].status, 'pending')
    await db.query(`update company_verifications set status='verified', reviewed_at=now() where user_id=$1`, [provider])
    const badge = (await as(outsider, 'select * from company_badge($1)', [provider])).rows[0]
    assert.deepEqual({ name: badge.company_name, fSkatt: badge.f_skatt, org: badge.org_number }, { name: 'Leverantören AB', fSkatt: true, org: undefined })
    // Ändrade uppgifter granskas på nytt.
    await as(provider, `select submit_company_verification('5560360793','Annat AB',false)`)
    assert.equal((await as(outsider, 'select * from company_badge($1)', [provider])).rows.length, 0)
  })

  await t.test('external references expose only submitted reviews and never the email', async () => {
    await assert.rejects(as(provider, `insert into external_references(provider_id,client_email,token_hash) values ($1,'kund@example.com','x')`, [provider]))
    await db.query(`insert into external_references(provider_id,client_email,token_hash) values ($1,'kund@example.com','a'), ($1,'annan@example.com','b')`, [provider])
    await db.query(`update external_references set client_name='Kund', rating=5, comment='Bra', submitted_at=now() where token_hash='a'`)
    await assert.rejects(as(outsider, 'select * from external_references'))
    const listed = (await as(outsider, 'select * from external_reference_list($1)', [provider])).rows
    assert.equal(listed.length, 1)
    assert.equal(listed[0].client_email, undefined)
    assert.equal((await as(provider, 'select * from my_reference_requests()')).rows.length, 2)
    assert.equal((await as(outsider, 'select * from my_reference_requests()')).rows.length, 0)
    await db.query(`insert into notification_outbox(recipient_email,kind,subject,body,path,dedupe_key) values ('kund@example.com','reference','s','b','/referens/x','reference:test')`)
    await assert.rejects(db.query(`insert into notification_outbox(kind,subject,body,path,dedupe_key) values ('reference','s','b','/referens/y','reference:none')`))
  })

  await t.test('portfolio items belong to their owner, use their own images and are capped at six', async () => {
    const own = `https://x.supabase.co/storage/v1/object/public/avatars/${provider}/portfolio/a.png`
    const foreign = `https://x.supabase.co/storage/v1/object/public/avatars/${outsider}/portfolio/a.png`
    await assert.rejects(as(outsider, `insert into portfolio_items(user_id,title) values ($1,'Fake')`, [provider]))
    await assert.rejects(as(provider, `insert into portfolio_items(user_id,title,image_url) values ($1,'Stolen',$2)`, [provider, foreign]))
    await as(provider, `insert into portfolio_items(user_id,title,image_url) values ($1,'Work 1',$2)`, [provider, own])
    for (let n = 2; n <= 6; n++) await as(provider, `insert into portfolio_items(user_id,title,url) values ($1,$2,'https://example.com')`, [provider, `Work ${n}`])
    await assert.rejects(as(provider, `insert into portfolio_items(user_id,title) values ($1,'Work 7')`, [provider]), { code: '54000' })
    await as(outsider, 'delete from portfolio_items where user_id=$1', [provider])
    assert.equal((await as(outsider, 'select count(*)::int as n from portfolio_items where user_id=$1', [provider])).rows[0].n, 6)
  })

  await t.test('response time is a median over answered inquiries and needs no message access', async () => {
    const before = (await as(outsider, 'select * from provider_response_time($1)', [provider])).rows[0]
    assert.equal(typeof before.samples, 'number')
    await assert.rejects(as(outsider, 'select * from messages where offer_id=$1', [offer]).then(result => { assert.equal(result.rows.length, 1) }))
  })

  await t.test('users can set their own website but not another user’s', async () => {
    await as(provider, `update users set website_url='https://example.com/' where id=$1`, [provider])
    await as(outsider, `update users set website_url='https://evil.example/' where id=$1`, [provider])
    assert.equal((await db.query('select website_url from users where id=$1', [provider])).rows[0].website_url, 'https://example.com/')
  })

  await t.test('owners edit open requests only, edits are stamped and bookkeeping columns stay locked', async () => {
    // Egen kund: den delade har förbrukat sin skrivkvot för uppdrag i tidigare tester.
    const editor = '44444444-4444-4444-8444-444444444444'
    await db.query(`insert into auth.users values ($1, '{"name":"Editor","role":"customer"}')`, [editor])
    const insert = `insert into jobs(customer_id,title,description,category,budget) values ($1,'Editable request','A sufficiently long description','design',5000) returning id`
    const open = (await as(editor, insert, [editor])).rows[0].id
    await as(editor, `update jobs set title='Edited request', budget=6000 where id=$1`, [open])
    const edited = (await db.query('select title, budget, edited_at from jobs where id=$1', [open])).rows[0]
    assert.deepEqual([edited.title, Number(edited.budget), edited.edited_at !== null], ['Edited request', 6000, true])

    await as(outsider, `update jobs set title='Hijacked' where id=$1`, [open])
    assert.equal((await db.query('select title from jobs where id=$1', [open])).rows[0].title, 'Edited request')
    await assert.rejects(as(editor, `update jobs set created_at=now() + interval '1 day' where id=$1`, [open]), { code: '42501' })
    await assert.rejects(as(editor, `update jobs set archived_at=null where id=$1`, [open]), { code: '42501' })

    const closed = (await as(editor, insert, [editor])).rows[0].id
    await as(editor, `update jobs set status='closed' where id=$1`, [closed])
    assert.equal((await db.query('select edited_at from jobs where id=$1', [closed])).rows[0].edited_at, null)
    await assert.rejects(as(editor, `update jobs set title='Too late' where id=$1`, [closed]), { code: '23514' })
  })

})
