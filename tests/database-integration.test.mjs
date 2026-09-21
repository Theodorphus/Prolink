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
    await assert.rejects(as(customer,'update jobs set requested_provider_id=$1 where id=$2',[outsider,privateJob]),{code:'23514'})
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
    await as(customer,'select mark_offer_read($1)',[offer])
    assert.equal((await as(customer,'select * from conversation_list(1)')).rows.find(row=>row.id===offer).unread,false)
  })
  await t.test('notification settings exclude non-matching categories',async()=>{
    await as(outsider, `update user_private_profiles set notification_categories=array['juridik'] where user_id=$1`,[outsider])
    const j=(await as(customer, `insert into jobs(customer_id,title,description,category) values ($1,'Category job','A sufficiently long description','webbutveckling') returning id`,[customer])).rows[0].id
    assert.equal((await db.query(`select count(*)::int as n from notification_outbox where recipient_id=$1 and path=$2`,[outsider,'/jobs/'+j])).rows[0].n,0)
    await assert.rejects(as(customer,`update user_private_profiles set email_jobs=false where user_id=$1 returning user_id`,[outsider]).then(result=> { assert.equal(result.rows.length,1) }))
  })

})
