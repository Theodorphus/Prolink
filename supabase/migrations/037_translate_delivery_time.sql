begin;

-- Tjänsternas leveranstid är fritext ("Enligt överenskommelse", "5 dagar ca")
-- och stod kvar på svenska på engelska sidor. Den översätts nu tillsammans med
-- titel och beskrivning och sparas på samma rad. Uppdrag har ingen leveranstid,
-- så kolumnen är tom för dem.
alter table public.content_translations
  add column delivery_time text check (char_length(delivery_time) <= 400);

commit;
