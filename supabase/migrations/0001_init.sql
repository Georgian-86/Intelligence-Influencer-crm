-- Vigor Talent Network — Phase 1 schema
-- Multi-tenant: organizations (platform / agency / brand), RBAC via role_permissions,
-- global talent pool, agency-scoped campaigns, briefs, intents (pipeline) and notes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type org_type as enum ('platform', 'agency', 'brand');
create type talent_status as enum ('pending', 'screening', 'approved', 'rejected', 'suspended');
create type talent_rank as enum ('bronze', 'silver', 'gold', 'platinum');
create type brief_status as enum ('draft', 'open', 'closed');
create type campaign_status as enum ('planning', 'active', 'completed', 'archived');
create type pipeline_stage as enum (
  'interested', 'shortlisted', 'contacted', 'negotiating', 'confirmed', 'delivered', 'rejected', 'dropped'
);
create type intent_source as enum ('applied', 'invited');
create type enquiry_status as enum ('new', 'in_progress', 'converted', 'closed');

-- ---------------------------------------------------------------------------
-- Tenancy & RBAC
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type org_type not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table roles (
  key text primary key,
  scope org_type not null,
  label text not null
);

create table role_permissions (
  role text not null references roles (key) on delete cascade,
  permission text not null,
  primary key (role, permission)
);

create table memberships (
  user_id uuid not null references profiles (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  role text not null references roles (key),
  created_at timestamptz not null default now(),
  primary key (user_id, org_id)
);

-- ---------------------------------------------------------------------------
-- Talent
-- ---------------------------------------------------------------------------
create table talent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references profiles (id) on delete cascade,
  display_name text not null,
  photo_url text,
  city text,
  gender text,
  date_of_birth date,
  languages text[] not null default '{}',
  bio text,
  is_influencer boolean not null default false,
  is_event_talent boolean not null default false,
  categories text[] not null default '{}',
  skills text[] not null default '{}',
  experience_years int,
  experience_notes text,
  rate_half_day int,
  rate_full_day int,
  rate_per_post int,
  rate_notes text,
  consent_share boolean not null default false,
  -- platform-controlled fields (protected by trigger)
  status talent_status not null default 'pending',
  rank talent_rank not null default 'bronze',
  rating numeric(3, 2),
  reliability_score int,
  review_notes text,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on talent_profiles (status);
create index on talent_profiles (city);
create index on talent_profiles using gin (categories);

-- Contact details live separately so they can be revealed selectively.
create table talent_contacts (
  talent_id uuid primary key references talent_profiles (id) on delete cascade,
  email text,
  phone text,
  whatsapp text
);

create table talent_media (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles (id) on delete cascade,
  kind text not null default 'video', -- video | portfolio | photo
  title text,
  url text not null,
  created_at timestamptz not null default now()
);

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles (id) on delete cascade,
  platform text not null default 'instagram',
  handle text not null,
  url text,
  -- fetched / computed metrics (protected by trigger)
  full_name text,
  biography text,
  profile_pic_url text,
  external_url text,
  business_category text,
  is_verified boolean,
  is_private boolean,
  followers int,
  following int,
  posts_count int,
  avg_likes numeric,
  avg_comments numeric,
  avg_views numeric,
  engagement_rate numeric(6, 2),
  view_rate numeric(7, 2),
  public_email text,
  public_phone text,
  fetch_status text not null default 'pending', -- pending | ok | error
  fetch_error text,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);
create index on social_accounts (talent_id);

create table social_snapshots (
  id bigint generated always as identity primary key,
  account_id uuid not null references social_accounts (id) on delete cascade,
  followers int,
  engagement_rate numeric(6, 2),
  view_rate numeric(7, 2),
  fetched_at timestamptz not null default now()
);

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references social_accounts (id) on delete cascade,
  shortcode text not null,
  post_type text,
  url text,
  caption text,
  thumbnail_url text,
  likes int,
  comments int,
  views int,
  posted_at timestamptz,
  unique (account_id, shortcode)
);

-- ---------------------------------------------------------------------------
-- Campaigns, briefs, intents
-- ---------------------------------------------------------------------------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  brand_name text,
  description text,
  status campaign_status not null default 'planning',
  start_date date,
  end_date date,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index on campaigns (org_id);

create table briefs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  title text not null,
  description text,
  brand_display text, -- what talent sees ("Confidential F&B brand" etc.)
  talent_kind text not null default 'influencer', -- influencer | event | any
  categories text[] not null default '{}',
  cities text[] not null default '{}',
  min_followers int,
  max_followers int,
  min_engagement numeric(6, 2),
  ranks talent_rank[] not null default '{}',
  deliverables text,
  budget_min int,
  budget_max int,
  event_date date,
  apply_by date,
  status brief_status not null default 'draft',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index on briefs (org_id);
create index on briefs (status);

create table intents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  brief_id uuid not null references briefs (id) on delete cascade,
  talent_id uuid not null references talent_profiles (id) on delete cascade,
  stage pipeline_stage not null default 'interested',
  source intent_source not null default 'applied',
  message text,
  quoted_rate int,
  agreed_rate int,
  deliverable_links text[] not null default '{}',
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brief_id, talent_id)
);
create index on intents (org_id);
create index on intents (talent_id);

create table pipeline_events (
  id bigint generated always as identity primary key,
  intent_id uuid not null references intents (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  from_stage pipeline_stage,
  to_stage pipeline_stage not null,
  actor uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  talent_id uuid not null references talent_profiles (id) on delete cascade,
  intent_id uuid references intents (id) on delete set null,
  body text not null,
  author_id uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index on notes (org_id, talent_id);

create table brand_enquiries (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  city text,
  requirement text not null,
  budget text,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

-- Usage ledger for future licensing / royalty reporting.
create table usage_events (
  id bigint generated always as identity primary key,
  org_id uuid not null references organizations (id) on delete cascade,
  kind text not null,
  ref_id uuid,
  actor uuid,
  created_at timestamptz not null default now()
);
create index on usage_events (org_id, kind);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies don't recurse)
-- ---------------------------------------------------------------------------
create or replace function public.has_perm(p_org uuid, p_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    join role_permissions rp on rp.role = m.role
    where m.user_id = auth.uid() and m.org_id = p_org
      and (rp.permission = p_perm or rp.permission = '*')
  );
$$;

create or replace function public.has_platform_perm(p_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    join organizations o on o.id = m.org_id and o.type = 'platform'
    join role_permissions rp on rp.role = m.role
    where m.user_id = auth.uid() and (rp.permission = p_perm or rp.permission = '*')
  );
$$;

create or replace function public.has_any_perm(p_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    join role_permissions rp on rp.role = m.role
    where m.user_id = auth.uid() and (rp.permission = p_perm or rp.permission = '*')
  );
$$;

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = auth.uid() and org_id = p_org);
$$;

create or replace function public.my_talent_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from talent_profiles where user_id = auth.uid();
$$;

create or replace function public.my_talent_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from talent_profiles where user_id = auth.uid() and status = 'approved');
$$;

-- Talent visible in the pool to this user (agencies: approved + consented; platform: all)
create or replace function public.can_see_talent(p_talent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from talent_profiles t where t.id = p_talent and t.user_id = auth.uid())
    or has_platform_perm('talent.view')
    or (
      has_any_perm('talent.view')
      and exists (select 1 from talent_profiles t where t.id = p_talent and t.status = 'approved' and t.consent_share)
    );
$$;

-- Contact reveal: own, platform staff, or an agency that has an intent with this talent.
create or replace function public.can_see_contact(p_talent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from talent_profiles t where t.id = p_talent and t.user_id = auth.uid())
    or has_platform_perm('talent.view')
    or exists (
      select 1 from intents i
      where i.talent_id = p_talent and has_perm(i.org_id, 'talent.view')
    );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger talent_touch before update on talent_profiles
  for each row execute function public.touch_updated_at();
create trigger intents_touch before update on intents
  for each row execute function public.touch_updated_at();

-- Talent cannot set their own status / rank / ratings.
create or replace function public.protect_talent_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new; -- service role / SQL console
  end if;
  if tg_op = 'INSERT' then
    if not has_platform_perm('talent.approve') then
      new.status := 'pending';
      new.rank := 'bronze';
      new.rating := null;
      new.reliability_score := null;
      new.review_notes := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
    return new;
  end if;
  if not has_platform_perm('talent.approve') then
    new.status := old.status;
    new.review_notes := old.review_notes;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;
  if not has_platform_perm('talent.rank') then
    new.rank := old.rank;
    new.rating := old.rating;
    new.reliability_score := old.reliability_score;
  end if;
  return new;
end;
$$;
create trigger talent_protect before insert or update on talent_profiles
  for each row execute function public.protect_talent_fields();

-- Metrics on social accounts are written only by the server (service role).
create or replace function public.protect_social_metrics()
returns trigger language plpgsql as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  new.full_name := null; new.biography := null; new.profile_pic_url := null;
  new.external_url := null; new.business_category := null; new.is_verified := null;
  new.is_private := null; new.followers := null; new.following := null;
  new.posts_count := null; new.avg_likes := null; new.avg_comments := null;
  new.avg_views := null; new.engagement_rate := null; new.view_rate := null;
  new.public_email := null; new.public_phone := null;
  new.fetch_status := 'pending'; new.fetch_error := null; new.last_fetched_at := null;
  return new;
end;
$$;
create trigger social_protect before insert on social_accounts
  for each row execute function public.protect_social_metrics();

-- Briefs inherit org from campaign.
create or replace function public.brief_set_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select org_id into new.org_id from campaigns where id = new.campaign_id;
  return new;
end;
$$;
create trigger brief_org before insert or update of campaign_id on briefs
  for each row execute function public.brief_set_org();

-- Intents inherit org from brief; talent-created intents are always "applied/interested".
create or replace function public.intent_prepare()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select org_id into new.org_id from briefs where id = new.brief_id;
    if auth.uid() is not null and not has_perm(new.org_id, 'pipeline.manage') then
      new.stage := 'interested';
      new.source := 'applied';
      new.agreed_rate := null;
      new.rating := null;
    end if;
  else
    new.org_id := old.org_id;
    new.brief_id := old.brief_id;
    new.talent_id := old.talent_id;
    if auth.uid() is not null and not has_perm(old.org_id, 'pipeline.manage') then
      -- talent may only edit their message / quote
      new.stage := old.stage;
      new.source := old.source;
      new.agreed_rate := old.agreed_rate;
      new.rating := old.rating;
      new.deliverable_links := old.deliverable_links;
    end if;
  end if;
  return new;
end;
$$;
create trigger intent_prepare before insert or update on intents
  for each row execute function public.intent_prepare();

create or replace function public.intent_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into pipeline_events (intent_id, org_id, from_stage, to_stage, actor)
    values (new.id, new.org_id, null, new.stage, auth.uid());
    insert into usage_events (org_id, kind, ref_id, actor)
    values (new.org_id, case when new.source = 'invited' then 'talent.invited' else 'intent.received' end, new.id, auth.uid());
  elsif new.stage is distinct from old.stage then
    insert into pipeline_events (intent_id, org_id, from_stage, to_stage, actor)
    values (new.id, new.org_id, old.stage, new.stage, auth.uid());
    if new.stage = 'confirmed' then
      insert into usage_events (org_id, kind, ref_id, actor) values (new.org_id, 'talent.confirmed', new.id, auth.uid());
    end if;
  end if;
  return new;
end;
$$;
create trigger intent_log after insert or update on intents
  for each row execute function public.intent_log();

create or replace function public.brief_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'open' and (tg_op = 'INSERT' or old.status is distinct from 'open') then
    insert into usage_events (org_id, kind, ref_id, actor) values (new.org_id, 'brief.published', new.id, auth.uid());
  end if;
  return new;
end;
$$;
create trigger brief_log after insert or update of status on briefs
  for each row execute function public.brief_log();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table memberships enable row level security;
alter table talent_profiles enable row level security;
alter table talent_contacts enable row level security;
alter table talent_media enable row level security;
alter table social_accounts enable row level security;
alter table social_snapshots enable row level security;
alter table social_posts enable row level security;
alter table campaigns enable row level security;
alter table briefs enable row level security;
alter table intents enable row level security;
alter table pipeline_events enable row level security;
alter table notes enable row level security;
alter table brand_enquiries enable row level security;
alter table usage_events enable row level security;

-- organizations / roles: readable by members & signed-in users
create policy org_read on organizations for select to authenticated
  using (is_org_member(id) or has_platform_perm('org.manage'));
create policy roles_read on roles for select to authenticated using (true);
create policy role_perms_read on role_permissions for select to authenticated using (true);

-- profiles
create policy profiles_self on profiles for select to authenticated
  using (id = auth.uid() or has_platform_perm('member.manage') or exists (
    select 1 from memberships a join memberships b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update_self on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- memberships
create policy memberships_read on memberships for select to authenticated
  using (user_id = auth.uid() or is_org_member(org_id) or has_platform_perm('member.manage'));
create policy memberships_write on memberships for all to authenticated
  using (has_perm(org_id, 'member.manage') or has_platform_perm('member.manage'))
  with check (has_perm(org_id, 'member.manage') or has_platform_perm('member.manage'));

-- talent_profiles
create policy talent_read on talent_profiles for select to authenticated
  using (can_see_talent(id));
create policy talent_insert_self on talent_profiles for insert to authenticated
  with check (user_id = auth.uid());
create policy talent_update on talent_profiles for update to authenticated
  using (user_id = auth.uid() or has_platform_perm('talent.approve') or has_platform_perm('talent.rank'))
  with check (user_id = auth.uid() or has_platform_perm('talent.approve') or has_platform_perm('talent.rank'));
create policy talent_delete on talent_profiles for delete to authenticated
  using (user_id = auth.uid() or has_platform_perm('talent.approve'));

-- talent_contacts
create policy contacts_read on talent_contacts for select to authenticated
  using (can_see_contact(talent_id));
create policy contacts_write_self on talent_contacts for all to authenticated
  using (talent_id = my_talent_id()) with check (talent_id = my_talent_id());

-- talent_media
create policy media_read on talent_media for select to authenticated using (can_see_talent(talent_id));
create policy media_write_self on talent_media for all to authenticated
  using (talent_id = my_talent_id()) with check (talent_id = my_talent_id());

-- social
create policy social_read on social_accounts for select to authenticated using (can_see_talent(talent_id));
create policy social_insert_self on social_accounts for insert to authenticated
  with check (talent_id = my_talent_id());
create policy social_delete_self on social_accounts for delete to authenticated
  using (talent_id = my_talent_id());
create policy snapshots_read on social_snapshots for select to authenticated
  using (exists (select 1 from social_accounts s where s.id = account_id and can_see_talent(s.talent_id)));
create policy posts_read on social_posts for select to authenticated
  using (exists (select 1 from social_accounts s where s.id = account_id and can_see_talent(s.talent_id)));

-- campaigns
create policy campaigns_read on campaigns for select to authenticated
  using (has_perm(org_id, 'talent.view') or has_perm(org_id, 'campaign.manage'));
create policy campaigns_write on campaigns for all to authenticated
  using (has_perm(org_id, 'campaign.manage')) with check (has_perm(org_id, 'campaign.manage'));

-- briefs
create policy briefs_org_read on briefs for select to authenticated
  using (has_perm(org_id, 'talent.view') or has_perm(org_id, 'brief.manage'));
create policy briefs_talent_read on briefs for select to authenticated
  using (status = 'open' and my_talent_approved());
create policy briefs_write on briefs for insert to authenticated
  with check (exists (select 1 from campaigns c where c.id = campaign_id and has_perm(c.org_id, 'brief.manage')));
create policy briefs_update on briefs for update to authenticated
  using (has_perm(org_id, 'brief.manage')) with check (has_perm(org_id, 'brief.manage'));
create policy briefs_delete on briefs for delete to authenticated
  using (has_perm(org_id, 'brief.manage'));

-- intents
create policy intents_talent_read on intents for select to authenticated
  using (talent_id = my_talent_id());
create policy intents_org_read on intents for select to authenticated
  using (has_perm(org_id, 'talent.view'));
create policy intents_talent_insert on intents for insert to authenticated
  with check (
    talent_id = my_talent_id() and my_talent_approved()
    and exists (select 1 from briefs b where b.id = brief_id and b.status = 'open')
  );
create policy intents_org_insert on intents for insert to authenticated
  with check (exists (select 1 from briefs b where b.id = brief_id and has_perm(b.org_id, 'pipeline.manage')));
create policy intents_update on intents for update to authenticated
  using (talent_id = my_talent_id() or has_perm(org_id, 'pipeline.manage'))
  with check (talent_id = my_talent_id() or has_perm(org_id, 'pipeline.manage'));
create policy intents_talent_withdraw on intents for delete to authenticated
  using (talent_id = my_talent_id() and stage = 'interested');
create policy intents_org_delete on intents for delete to authenticated
  using (has_perm(org_id, 'pipeline.manage'));

create policy pipeline_events_read on pipeline_events for select to authenticated
  using (has_perm(org_id, 'talent.view'));

-- notes (agency-private)
create policy notes_read on notes for select to authenticated using (has_perm(org_id, 'talent.view'));
create policy notes_insert on notes for insert to authenticated
  with check (has_perm(org_id, 'note.write') and author_id = auth.uid());
create policy notes_delete on notes for delete to authenticated
  using (author_id = auth.uid() or has_perm(org_id, 'member.manage'));

-- brand enquiries: anyone can submit, staff can read/update
create policy enquiries_insert on brand_enquiries for insert to anon, authenticated with check (true);
create policy enquiries_read on brand_enquiries for select to authenticated using (has_any_perm('enquiry.view'));
create policy enquiries_update on brand_enquiries for update to authenticated
  using (has_any_perm('enquiry.view')) with check (has_any_perm('enquiry.view'));

create policy usage_read on usage_events for select to authenticated
  using (has_perm(org_id, 'member.manage') or has_platform_perm('org.manage'));

-- ---------------------------------------------------------------------------
-- Seed: roles, permissions, initial organizations
-- ---------------------------------------------------------------------------
insert into roles (key, scope, label) values
  ('super_admin', 'platform', 'Super admin'),
  ('platform_ops', 'platform', 'Platform operations'),
  ('hr_screener', 'platform', 'HR screener'),
  ('org_owner', 'agency', 'Agency owner'),
  ('org_admin', 'agency', 'Agency admin'),
  ('campaign_manager', 'agency', 'Campaign manager'),
  ('scout', 'agency', 'Scout / viewer');

insert into role_permissions (role, permission) values
  ('super_admin', '*'),
  ('platform_ops', 'talent.view'), ('platform_ops', 'talent.approve'), ('platform_ops', 'talent.rank'),
  ('platform_ops', 'enquiry.view'), ('platform_ops', 'member.manage'),
  ('hr_screener', 'talent.view'), ('hr_screener', 'talent.approve'), ('hr_screener', 'talent.rank'),
  ('org_owner', 'talent.view'), ('org_owner', 'campaign.manage'), ('org_owner', 'brief.manage'),
  ('org_owner', 'pipeline.manage'), ('org_owner', 'note.write'), ('org_owner', 'export'),
  ('org_owner', 'member.manage'), ('org_owner', 'enquiry.view'),
  ('org_admin', 'talent.view'), ('org_admin', 'campaign.manage'), ('org_admin', 'brief.manage'),
  ('org_admin', 'pipeline.manage'), ('org_admin', 'note.write'), ('org_admin', 'export'),
  ('org_admin', 'member.manage'), ('org_admin', 'enquiry.view'),
  ('campaign_manager', 'talent.view'), ('campaign_manager', 'campaign.manage'),
  ('campaign_manager', 'brief.manage'), ('campaign_manager', 'pipeline.manage'),
  ('campaign_manager', 'note.write'), ('campaign_manager', 'export'), ('campaign_manager', 'enquiry.view'),
  ('scout', 'talent.view'), ('scout', 'note.write');

insert into organizations (id, name, slug, type) values
  ('00000000-0000-0000-0000-000000000001', 'Vigor Talent Network', 'vigor-talent-network', 'platform'),
  ('00000000-0000-0000-0000-000000000002', 'Vigor Marketing', 'vigor', 'agency');
