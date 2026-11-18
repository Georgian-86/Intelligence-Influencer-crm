-- A talent must be able to read their own row inside the same statement that creates it
-- (INSERT ... RETURNING / upsert). can_see_talent() runs on a snapshot that can't see the new row yet.
drop policy talent_read on talent_profiles;
create policy talent_read on talent_profiles for select to authenticated
  using (user_id = auth.uid() or can_see_talent(id));
