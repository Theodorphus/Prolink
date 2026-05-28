-- ─────────────────────────────────────────
-- SEED: realistiska Göteborg-jobb för jobbswipe + hemsidan
-- Kör direkt i Supabase SQL Editor.
-- Skapar 4 "arbetsgivar"-konton och ~14 öppna jobb spridda över kategorier.
-- Lösenord för alla konton: password123
-- Säker att köra om: rensar tidigare seedade jobb/konton först.
-- ─────────────────────────────────────────

do $$
declare
  emp_cafe_id    uuid := gen_random_uuid();
  emp_stad_id    uuid := gen_random_uuid();
  emp_lager_id   uuid := gen_random_uuid();
  emp_butik_id   uuid := gen_random_uuid();
begin

  -- ── Rensa tidigare seed (idempotent) ────────────────────────────────
  delete from auth.users where email in (
    'jobb@anglamark-cafe.se',
    'jobb@stadbolagetgbg.se',
    'jobb@nordlager.se',
    'jobb@butiksgruppen.se'
  );

  -- ── Arbetsgivarkonton ───────────────────────────────────────────────
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    (emp_cafe_id, '00000000-0000-0000-0000-000000000000', 'jobb@anglamark-cafe.se',
     crypt('password123', gen_salt('bf')), now(),
     jsonb_build_object('role', 'customer', 'name', 'Änglamark Café'), now(), now(), '', '', '', ''),
    (emp_stad_id, '00000000-0000-0000-0000-000000000000', 'jobb@stadbolagetgbg.se',
     crypt('password123', gen_salt('bf')), now(),
     jsonb_build_object('role', 'customer', 'name', 'Städbolaget Göteborg'), now(), now(), '', '', '', ''),
    (emp_lager_id, '00000000-0000-0000-0000-000000000000', 'jobb@nordlager.se',
     crypt('password123', gen_salt('bf')), now(),
     jsonb_build_object('role', 'customer', 'name', 'NordLager AB'), now(), now(), '', '', '', ''),
    (emp_butik_id, '00000000-0000-0000-0000-000000000000', 'jobb@butiksgruppen.se',
     crypt('password123', gen_salt('bf')), now(),
     jsonb_build_object('role', 'customer', 'name', 'Butiksgruppen Väst'), now(), now(), '', '', '', '');

  -- Trigger handle_new_user skapar public.users automatiskt.

  -- ── Jobb ────────────────────────────────────────────────────────────
  -- Spridda created_at så listan ser levande ut.
  insert into public.jobs
    (customer_id, title, description, category, salary, location, work_type, employer_name, status, is_demo, created_at)
  values
    (emp_cafe_id,
     'Barista till mysigt café i Haga',
     'Vi söker en glad barista som älskar kaffe och möten med människor. Du tar emot beställningar, brygger specialkaffe och håller det fint i lokalen. Erfarenhet är ett plus men inget krav – vi lär dig allt du behöver. Helg och vissa vardagar.',
     'cafe', '145 kr/tim', 'Haga', 'deltid', 'Änglamark Café', 'open', true, now() - interval '2 hours'),

    (emp_cafe_id,
     'Cafébiträde – extra inför sommaren',
     'Inför sommarsäsongen behöver vi extra händer. Du hjälper till i kassan, dukar av, fyller på och ser till att gästerna trivs. Perfekt extrajobb för dig som studerar. Flexibla pass.',
     'cafe', 'Enl. kollektivavtal', 'Linné', 'extrajobb', 'Änglamark Café', 'open', true, now() - interval '6 hours'),

    (emp_stad_id,
     'Lokalvårdare sökes – centrala Göteborg',
     'Vi utökar vårt team och söker noggranna lokalvårdare för kontorsstädning på morgnar. Du jobbar självständigt enligt checklista. Körkort är meriterande men inget krav. Tillträde omgående.',
     'stad', '155 kr/tim', 'Centrum', 'heltid', 'Städbolaget Göteborg', 'open', true, now() - interval '1 day'),

    (emp_stad_id,
     'Trappstädning på Hisingen – kvällar',
     'Vi söker dig som vill jobba kvällstid med trappstädning i bostadsområden på Hisingen. Lugnt och självständigt arbete. Bra för dig som vill kombinera med studier eller annat jobb.',
     'stad', '160 kr/tim', 'Hisingen', 'deltid', 'Städbolaget Göteborg', 'open', true, now() - interval '1 day 4 hours'),

    (emp_stad_id,
     'Flyttstädning – extrapersonal',
     'Behöver pålitlig person för flyttstädningar runt om i Göteborg. Arbetet sker dagtid, ofta i team om två. Vi står för material och transport. Timanställning med möjlighet till fler pass.',
     'stad', '170 kr/tim', 'Göteborg', 'extrajobb', 'Städbolaget Göteborg', 'open', true, now() - interval '2 days'),

    (emp_lager_id,
     'Lagermedarbetare till e-handelslager',
     'Plocka, packa och hantera inkommande gods i vårt moderna lager i Bäckebol. Du jobbar i ett glatt team och vi har bra rutiner. Truckkort är meriterande. Dag- och kvällspass finns.',
     'lager', '152 kr/tim', 'Bäckebol', 'heltid', 'NordLager AB', 'open', true, now() - interval '8 hours'),

    (emp_lager_id,
     'Truckförare (B2 / motvikt)',
     'Erfaren truckförare sökes till vårt distributionslager. Du lossar och lastar samt sköter interna transporter. Krav på giltigt truckkort B2. Skiftarbete med OB-tillägg.',
     'lager', '185 kr/tim', 'Hisings Backa', 'heltid', 'NordLager AB', 'open', true, now() - interval '3 days'),

    (emp_lager_id,
     'Helgplockare – extrajobb på lager',
     'Vi söker dig som vill jobba helger på vårt lager. Enkla arbetsuppgifter: plock och pack efter orderlista. Inga förkunskaper krävs, vi visar dig allt. Perfekt vid sidan av studier.',
     'lager', '148 kr/tim', 'Bäckebol', 'extrajobb', 'NordLager AB', 'open', true, now() - interval '5 hours'),

    (emp_butik_id,
     'Säljare till klädbutik på Avenyn',
     'Vi söker en serviceinriktad säljare som brinner för mode och kundmöten. Du hjälper kunder, sköter kassan och håller butiken inspirerande. Helgtjänst med chans till fler timmar.',
     'butik', 'Fast månadslön', 'Avenyn', 'deltid', 'Butiksgruppen Väst', 'open', true, now() - interval '12 hours'),

    (emp_butik_id,
     'Butiksmedarbetare – livsmedel, Frölunda',
     'Till vår livsmedelsbutik i Frölunda Torg söker vi en pålitlig medarbetare. Kassa, varupåfyllning och kundservice. Tidiga morgnar förekommer. Vi värdesätter punktlighet och positiv attityd.',
     'butik', '149 kr/tim', 'Västra Frölunda', 'deltid', 'Butiksgruppen Väst', 'open', true, now() - interval '1 day 8 hours'),

    (emp_butik_id,
     'Extrajobb i butik inför helgerna',
     'Vi behöver extrapersonal under helger och högsäsong. Du hjälper till med påfyllning, prismärkning och kassa. Inga krav på erfarenhet. Ett kul och socialt extrajobb.',
     'extrajobb', '143 kr/tim', 'Nordstan', 'extrajobb', 'Butiksgruppen Väst', 'open', true, now() - interval '20 hours'),

    (emp_cafe_id,
     'Diskare / köksbiträde kvällstid',
     'Vårt café söker en köksbiträde som hjälper till med disk, enklare förberedelser och att hålla köket rent. Kvällspass, främst torsdag till lördag. Glatt gäng och bra stämning.',
     'restaurang', '150 kr/tim', 'Majorna', 'deltid', 'Änglamark Café', 'open', true, now() - interval '2 days 6 hours'),

    (emp_lager_id,
     'Budbilförare – distribution i Göteborg',
     'Vi söker en stresstålig förare för paketdistribution i Göteborgsområdet. B-körkort krävs. Du planerar din rutt och levererar med ett leende. Dagtid, måndag–fredag.',
     'transport', '158 kr/tim', 'Göteborg', 'heltid', 'NordLager AB', 'open', true, now() - interval '4 days'),

    (emp_stad_id,
     'Fönsterputsare sökes – inga förkunskaper',
     'Gillar du fysiskt arbete utomhus? Vi söker fönsterputsare för villa- och kontorskunder. Vi lär upp dig från grunden. Körkort är ett plus. Bra timlön och trevliga kollegor.',
     'annat', '165 kr/tim', 'Mölndal', 'deltid', 'Städbolaget Göteborg', 'open', true, now() - interval '3 days 5 hours');

end $$;
