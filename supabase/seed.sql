-- ─────────────────────────────────────────
-- SEED DATA
-- Kör direkt i Supabase SQL Editor.
-- Lösenord för alla testkonton: password123
-- Kund:      anna@prolink.se
-- Leverantör 1: erik@prolink.se
-- Leverantör 2: sofia@prolink.se
-- ─────────────────────────────────────────

do $$
declare
  customer_id  uuid := gen_random_uuid();
  provider1_id uuid := gen_random_uuid();
  provider2_id uuid := gen_random_uuid();
  job1_id      uuid;
  job2_id      uuid;
  job3_id      uuid;
  offer1_id    uuid;
  offer2_id    uuid;
begin

  -- ── Auth-användare ──────────────────────────────────────────────────
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    (
      customer_id,
      '00000000-0000-0000-0000-000000000000',
      'anna@prolink.se',
      crypt('password123', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'customer', 'name', 'Anna Lindqvist'),
      now(), now(), '', '', '', ''
    ),
    (
      provider1_id,
      '00000000-0000-0000-0000-000000000000',
      'erik@prolink.se',
      crypt('password123', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'provider', 'name', 'Erik Johansson'),
      now(), now(), '', '', '', ''
    ),
    (
      provider2_id,
      '00000000-0000-0000-0000-000000000000',
      'sofia@prolink.se',
      crypt('password123', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'provider', 'name', 'Sofia Bergström'),
      now(), now(), '', '', '', ''
    );

  -- Trigger handle_new_user skapar public.users automatiskt.
  -- Komplettera profilerna med bio, kompetenser och timpris.
  update public.users set
    bio        = 'Driver ett litet e-handelsföretag och behöver hjälp med webbutveckling och design.',
    skills     = null,
    hourly_rate = null
  where id = customer_id;

  update public.users set
    bio        = 'Fullstack-utvecklare med 8 års erfarenhet av React, Node.js och molntjänster.',
    skills     = array['React', 'Next.js', 'Node.js', 'Supabase', 'TypeScript'],
    hourly_rate = 850
  where id = provider1_id;

  update public.users set
    bio        = 'UX/UI-designer och frontendutvecklare. Specialiserad på Figma och Tailwind CSS.',
    skills     = array['Figma', 'Tailwind CSS', 'React', 'Illustrator'],
    hourly_rate = 750
  where id = provider2_id;

  -- ── Tjänster ──────────────────────────────────────────────────────────
  insert into public.services (provider_id, title, description, price, delivery_time) values
    (provider1_id, 'Landningssida i Next.js',
     'Professionell landningssida med Next.js och Tailwind CSS. Responsiv, SEO-optimerad och snabb.',
     4500, '5 arbetsdagar'),
    (provider1_id, 'Supabase-integration',
     'Kopplar din app mot Supabase med auth, databas och storage. Inkluderar RLS-policies.',
     6000, '3 arbetsdagar'),
    (provider2_id, 'UI-design i Figma',
     'Komplett designpaket: wireframes, komponenter och färdig design som är redo att koda.',
     8000, '7 arbetsdagar'),
    (provider2_id, 'Logotyp & varumärkesprofil',
     'Logotyp, färgpalett och typografi. Levereras som SVG, PNG och PDF.',
     3500, '4 arbetsdagar');

  -- ── Uppdrag ──────────────────────────────────────────────────────────
  insert into public.jobs (id, customer_id, title, description, budget, status)
  values (gen_random_uuid(), customer_id,
    'Bygg en bokningssida för vår frisersalong',
    'Vi behöver en enkel bokningssida med kalender, bekräftelsemejl och adminvy. Ska fungera på mobil.',
    15000, 'open')
  returning id into job1_id;

  insert into public.jobs (id, customer_id, title, description, budget, status)
  values (gen_random_uuid(), customer_id,
    'Fixa bugg i React-app – state uppdateras inte',
    'Vi har en bugg i vår befintliga React-app. State uppdateras inte korrekt efter API-anrop i useEffect.',
    2000, 'open')
  returning id into job2_id;

  insert into public.jobs (id, customer_id, title, description, budget, status)
  values (gen_random_uuid(), customer_id,
    'Ny design för vår webbshop',
    'Vi vill ha en modern redesign av vår Shopify-butik. Fokus på konvertering och mobilanvändare.',
    null, 'open')
  returning id into job3_id;

  -- ── Offerter ──────────────────────────────────────────────────────────
  insert into public.offers (job_id, provider_id, price, price_type, timeline, description, status)
  values (job1_id, provider1_id, 12000, 'fixed', '10 arbetsdagar',
    'Jag bygger hela bokningssidan med react-big-calendar, Supabase-backend och mejlbekräftelse via Resend. Responsiv design och adminvy ingår.',
    'pending')
  returning id into offer1_id;

  insert into public.offers (job_id, provider_id, price, price_type, timeline, description, status)
  values (job3_id, provider2_id, 750, 'hourly', 'Ca 3 veckor',
    'Jag gör en komplett redesign i Figma först (2-3 dagar), sedan implementerar jag i HTML/CSS/JS. Pris per timme, uppskattat 20–25 timmar.',
    'pending')
  returning id into offer2_id;

  -- ── Chatmeddelanden ────────────────────────────────────────────────────
  insert into public.messages (offer_id, sender_id, content) values
    (offer1_id, provider1_id, 'Hej Anna! Jag har tittat på uppdraget och kan starta direkt nästa vecka. Har du några specifika önskemål kring designen?'),
    (offer1_id, customer_id,  'Hej Erik! Kul! Vi vill ha en enkel och modern design, gärna i blå och vit. Ska funka bra på mobil.'),
    (offer1_id, provider1_id, 'Perfekt, det löser jag. Jag skickar ett designförslag inom ett par dagar så du kan godkänna innan jag börjar koda.');

  insert into public.messages (offer_id, sender_id, content) values
    (offer2_id, provider2_id, 'Hej! Jag har lång erfarenhet av Shopify-design. Kan vi boka ett kort möte för att gå igenom era mål och målgrupp?'),
    (offer2_id, customer_id,  'Absolut! Vi är tillgängliga torsdag eller fredag denna vecka.');

end $$;
