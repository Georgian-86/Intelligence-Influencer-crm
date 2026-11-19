-- College graph v1: one education row per talent (used by onboarding and the creator dashboard).
create table if not exists talent_education (
  talent_id uuid primary key references talent_profiles (id) on delete cascade,
  college_name text not null,
  graduation_year int check (graduation_year between 1990 and 2040),
  created_at timestamptz not null default now()
);

alter table talent_education enable row level security;

drop policy if exists education_read on talent_education;
create policy education_read on talent_education for select to authenticated
  using (talent_id = my_talent_id() or can_see_talent(talent_id));

drop policy if exists education_write_self on talent_education;
create policy education_write_self on talent_education for all to authenticated
  using (talent_id = my_talent_id()) with check (talent_id = my_talent_id());
