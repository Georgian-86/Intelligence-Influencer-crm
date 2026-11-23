-- One stored Apify result per Instagram handle, so a handle is only ever fetched (and paid for) once.
-- Only the server's service-role key reads or writes it: RLS is on with no policies.
create table if not exists instagram_cache (
  handle text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table instagram_cache enable row level security;
