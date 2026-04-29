-- ─────────────────────────────────────────
-- SEED DATA — kör i Supabase SQL Editor
-- OBS: Skapa användarna via Auth-flödet först,
-- sedan uppdatera UUID:erna nedan.
-- ─────────────────────────────────────────

-- Exempelanvändare (ersätt UUID med riktiga auth-user-id:n)
do $$
declare
  customer_id uuid := '00000000-0000-0000-0000-000000000001';
  provider_id uuid := '00000000-0000-0000-0000-000000000002';
  job_id      uuid;
  offer_id    uuid;
begin

  -- Profiler
  insert into public.users (id, role, name, bio, skills, hourly_rate) values
    (customer_id, 'customer', 'Anna Kund',     'Sköter e-handel och marknadsföring.',  null,                    null),
    (provider_id, 'provider', 'Erik Leverantör','Fullstack-utvecklare med 8 års erfarenhet.', array['React','Node.js','Supabase'], 850)
  on conflict (id) do nothing;

  -- Tjänst
  insert into public.services (provider_id, title, description, price, delivery_time) values
    (provider_id, 'Landningssida i Next.js', 'Jag bygger en professionell landningssida med Next.js och Tailwind CSS.', 4500, '5 arbetsdagar'),
    (provider_id, 'Supabase-integration',    'Jag kopplar din app mot Supabase med auth, databas och storage.',        6000, '3 arbetsdagar');

  -- Uppdrag
  insert into public.jobs (customer_id, title, description, budget, status)
  values (customer_id, 'Bygg en bokningssida', 'Vi behöver en enkel bokningssida för vår frisersalong. Kalender, bekräftelsemejl och adminvy.', 15000, 'open')
  returning id into job_id;

  insert into public.jobs (customer_id, title, description, budget, status)
  values (customer_id, 'Fixa bugg i React-app', 'Vi har en bugg i vår befintliga React-app som gör att state inte uppdateras korrekt.', 2000, 'open');

  -- Offert
  insert into public.offers (job_id, provider_id, price, price_type, timeline, description, status)
  values (job_id, provider_id, 12000, 'fixed', '10 arbetsdagar',
    'Jag kan bygga hela bokningssidan med kalender (react-big-calendar), Supabase-backend och mejlbekräftelse via Resend. Inkluderar responsiv design och adminvy.',
    'pending')
  returning id into offer_id;

  -- Chatmeddelanden
  insert into public.messages (offer_id, sender_id, content) values
    (offer_id, provider_id, 'Hej! Jag har kollat på uppdraget och kan starta direkt. Har du några specifika önskemål kring designen?'),
    (offer_id, customer_id, 'Hej! Det låter bra. Vi vill ha en enkel och modern design, gärna i blå och vit färg.'),
    (offer_id, provider_id, 'Perfekt, det fixar jag. Jag skickar ett designförslag imorgon.');

end $$;
