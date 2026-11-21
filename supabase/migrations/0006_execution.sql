-- 0006 · Execution layer: brand portal access, shortlist approvals, deliverables & content review,
-- creator payouts and brand invoices. Safe to run once on a database that has 0001–0005.
--
-- Privacy (decision log D4): brands never read talent tables directly. Everything a brand sees goes
-- through the security-definer functions at the bottom, which return brand-safe fields only
-- (no phone, email, DOB, internal notes, creator cost or review notes).

-- ---------------------------------------------------------------------------
-- Roles & permissions
-- ---------------------------------------------------------------------------
insert into roles (key, scope, label) values
  ('brand_admin', 'brand', 'Brand admin'),
  ('brand_member', 'brand', 'Brand member')
on conflict (key) do nothing;

insert into role_permissions (role, permission) values
  ('brand_admin', 'brand.view'), ('brand_admin', 'brand.approve'),
  ('brand_member', 'brand.view'), ('brand_member', 'brand.approve'),
  ('org_owner', 'finance.manage'), ('org_admin', 'finance.manage'),
  ('platform_ops', 'org.manage')
on conflict do nothing;

-- A role can only be held in an organisation of its own scope (stops e.g. an agency owner
-- granting themselves a platform role inside their own org).
create or replace function public.membership_scope_check()
returns trigger language plpgsql security definer set search_path = public as $$
declare r_scope org_type; o_type org_type;
begin
  select scope into r_scope from roles where key = new.role;
  select type into o_type from organizations where id = new.org_id;
  if r_scope is distinct from o_type then
    raise exception 'Role % cannot be used in a % organisation', new.role, o_type using errcode = '22023';
  end if;
  return new;
end;
$$;
drop trigger if exists membership_scope on memberships;
create trigger membership_scope before insert or update on memberships
  for each row execute function public.membership_scope_check();

-- Platform staff can create brand / agency organisations from the admin panel.
drop policy if exists org_insert on organizations;
create policy org_insert on organizations for insert to authenticated with check (has_platform_perm('org.manage'));
drop policy if exists org_update on organizations;
create policy org_update on organizations for update to authenticated
  using (has_platform_perm('org.manage')) with check (has_platform_perm('org.manage'));
-- Agency staff need to see brand org names to link a campaign to one.
drop policy if exists org_brand_read on organizations;
create policy org_brand_read on organizations for select to authenticated
  using (type = 'brand' and has_any_perm('campaign.manage'));

-- ---------------------------------------------------------------------------
-- Campaign planning fields + brand link
-- ---------------------------------------------------------------------------
alter table campaigns
  add column if not exists brand_org_id uuid references organizations (id) on delete set null,
  add column if not exists owner_id uuid references profiles (id) on delete set null,
  add column if not exists budget int,
  add column if not exists creators_target int,
  add column if not exists go_live date,
  add column if not exists reach_target bigint,
  add column if not exists views_target bigint,
  add column if not exists er_target numeric(5, 2);
create index if not exists campaigns_brand_org_idx on campaigns (brand_org_id);

drop policy if exists campaigns_brand_read on campaigns;
create policy campaigns_brand_read on campaigns for select to authenticated
  using (brand_org_id is not null and has_perm(brand_org_id, 'brand.view'));

-- ---------------------------------------------------------------------------
-- Shortlist sharing & brand decisions
-- ---------------------------------------------------------------------------
alter table intents
  add column if not exists shared_with_brand_at timestamptz,
  add column if not exists brand_fee int;  -- fee shown to the brand (set by the agency; never the creator's cost)

create table if not exists shortlist_decisions (
  intent_id uuid primary key references intents (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  decision text not null check (decision in ('approved', 'passed', 'question')),
  note text,
  decided_by uuid references profiles (id) on delete set null,
  decided_at timestamptz not null default now()
);
alter table shortlist_decisions enable row level security;
drop policy if exists decisions_agency_read on shortlist_decisions;
create policy decisions_agency_read on shortlist_decisions for select to authenticated
  using (has_perm(org_id, 'talent.view'));
-- No write policies: brands decide through brand_decide().

-- Talent may not touch the new agency-only intent columns. Internal writes (triggers below) set
-- vtn.system so they can advance a stage on the creator's behalf.
create or replace function public.intent_prepare()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('vtn.system', true), '') = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    select org_id into new.org_id from briefs where id = new.brief_id;
    if auth.uid() is not null and not has_perm(new.org_id, 'pipeline.manage') then
      new.stage := 'interested';
      new.source := 'applied';
      new.agreed_rate := null;
      new.rating := null;
      new.shared_with_brand_at := null;
      new.brand_fee := null;
    end if;
  else
    new.org_id := old.org_id;
    new.brief_id := old.brief_id;
    new.talent_id := old.talent_id;
    if auth.uid() is not null and not has_perm(old.org_id, 'pipeline.manage') then
      new.stage := old.stage;
      new.source := old.source;
      new.agreed_rate := old.agreed_rate;
      new.rating := old.rating;
      new.deliverable_links := old.deliverable_links;
      new.shared_with_brand_at := old.shared_with_brand_at;
      new.brand_fee := old.brand_fee;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Deliverables, versions, review comments, metrics
-- ---------------------------------------------------------------------------
do $$ begin
  create type deliverable_status as enum ('brief_sent', 'draft_submitted', 'changes_requested', 'approved', 'live');
exception when duplicate_object then null; end $$;

create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  intent_id uuid not null references intents (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  talent_id uuid not null references talent_profiles (id) on delete cascade,
  kind text not null default 'Reel',
  title text,
  due_date date,
  status deliverable_status not null default 'brief_sent',
  brand_visible boolean not null default false,
  live_url text,
  posted_at timestamptz,
  views int,
  likes int,
  comments int,
  metrics_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deliverables_campaign_idx on deliverables (campaign_id);
create index if not exists deliverables_talent_idx on deliverables (talent_id);
create index if not exists deliverables_intent_idx on deliverables (intent_id);

create table if not exists deliverable_versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables (id) on delete cascade,
  version int not null,
  caption text,
  media_url text,      -- external link (Drive, Instagram, YouTube)
  storage_path text,   -- object in the private "deliverables" bucket
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (deliverable_id, version)
);

create table if not exists deliverable_comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables (id) on delete cascade,
  version int,
  author_id uuid references profiles (id) on delete set null,
  author_role text not null check (author_role in ('agency', 'brand', 'creator')),
  decision text check (decision in ('approved', 'changes')),
  internal boolean not null default false,  -- agency-only note, hidden from creator and brand
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists deliverable_comments_idx on deliverable_comments (deliverable_id, created_at);

create table if not exists deliverable_metrics (
  id bigint generated always as identity primary key,
  deliverable_id uuid not null references deliverables (id) on delete cascade,
  views int,
  likes int,
  comments int,
  captured_at timestamptz not null default now()
);
create index if not exists deliverable_metrics_idx on deliverable_metrics (deliverable_id, captured_at);

drop trigger if exists deliverables_touch on deliverables;
create trigger deliverables_touch before update on deliverables
  for each row execute function public.touch_updated_at();

-- Deliverables inherit org / campaign / talent from their booking (intent).
create or replace function public.deliverable_prepare()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select i.org_id, b.campaign_id, i.talent_id into new.org_id, new.campaign_id, new.talent_id
  from intents i join briefs b on b.id = i.brief_id where i.id = new.intent_id;
  if new.org_id is null then raise exception 'Unknown booking %', new.intent_id; end if;
  return new;
end;
$$;
drop trigger if exists deliverable_prepare on deliverables;
create trigger deliverable_prepare before insert or update of intent_id on deliverables
  for each row execute function public.deliverable_prepare();

-- Metrics snapshots for the report chart.
create or replace function public.deliverable_metrics_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.views is distinct from old.views or new.likes is distinct from old.likes or new.comments is distinct from old.comments then
    insert into deliverable_metrics (deliverable_id, views, likes, comments) values (new.id, new.views, new.likes, new.comments);
  end if;
  return new;
end;
$$;
drop trigger if exists deliverable_metrics_log on deliverables;
create trigger deliverable_metrics_log after update on deliverables
  for each row execute function public.deliverable_metrics_log();

-- When every deliverable of a booking is live, the booking moves to "delivered".
create or replace function public.deliverable_complete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'live' and old.status is distinct from 'live'
     and not exists (select 1 from deliverables d where d.intent_id = new.intent_id and d.status <> 'live') then
    perform set_config('vtn.system', 'on', true);
    update intents set stage = 'delivered',
      deliverable_links = (select coalesce(array_agg(d.live_url) filter (where d.live_url is not null), '{}') from deliverables d where d.intent_id = new.intent_id)
    where id = new.intent_id and stage = 'confirmed';
    perform set_config('vtn.system', '', true);
  end if;
  return new;
end;
$$;
drop trigger if exists deliverable_complete on deliverables;
create trigger deliverable_complete after update of status on deliverables
  for each row execute function public.deliverable_complete();

alter table deliverables enable row level security;
alter table deliverable_versions enable row level security;
alter table deliverable_comments enable row level security;
alter table deliverable_metrics enable row level security;

drop policy if exists deliverables_read on deliverables;
create policy deliverables_read on deliverables for select to authenticated
  using (has_perm(org_id, 'talent.view') or talent_id = my_talent_id());
drop policy if exists deliverables_write on deliverables;
create policy deliverables_write on deliverables for all to authenticated
  using (has_perm(org_id, 'pipeline.manage')) with check (has_perm(org_id, 'pipeline.manage'));

drop policy if exists versions_read on deliverable_versions;
create policy versions_read on deliverable_versions for select to authenticated
  using (exists (select 1 from deliverables d where d.id = deliverable_id and (has_perm(d.org_id, 'talent.view') or d.talent_id = my_talent_id())));

drop policy if exists dcomments_read on deliverable_comments;
create policy dcomments_read on deliverable_comments for select to authenticated
  using (exists (select 1 from deliverables d where d.id = deliverable_id
    and (has_perm(d.org_id, 'talent.view') or (d.talent_id = my_talent_id() and not internal))));

drop policy if exists dmetrics_read on deliverable_metrics;
create policy dmetrics_read on deliverable_metrics for select to authenticated
  using (exists (select 1 from deliverables d where d.id = deliverable_id and (has_perm(d.org_id, 'talent.view') or d.talent_id = my_talent_id())));
-- Versions and comments are written only through submit_deliverable() / review_deliverable().

-- ---------------------------------------------------------------------------
-- Creator payouts (tracked; money moves outside the app until v3 — decision D6)
-- ---------------------------------------------------------------------------
do $$ begin
  create type payment_status as enum ('pending', 'approved', 'paid', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  intent_id uuid not null unique references intents (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  talent_id uuid not null references talent_profiles (id) on delete cascade,
  amount int not null default 0,
  tds int not null default 0,
  status payment_status not null default 'pending',
  due_date date,
  utr text,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_org_idx on payments (org_id, status);
create index if not exists payments_talent_idx on payments (talent_id);

drop trigger if exists payments_touch on payments;
create trigger payments_touch before update on payments
  for each row execute function public.touch_updated_at();

-- FN-6: a payout can be approved or paid only once the booking is delivered; paid needs a UTR.
create or replace function public.payment_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved', 'paid') and old.status is distinct from new.status
     and not exists (select 1 from intents where id = new.intent_id and stage = 'delivered') then
    raise exception 'A payout can be approved only after the content is delivered' using errcode = '22023';
  end if;
  if new.status = 'paid' then
    if coalesce(trim(new.utr), '') = '' then
      raise exception 'Add the UTR / bank reference before marking a payout paid' using errcode = '22023';
    end if;
    new.paid_at := coalesce(new.paid_at, now());
  end if;
  if new.tds < 0 or new.tds > new.amount then
    raise exception 'TDS must be between 0 and the payout amount' using errcode = '22023';
  end if;
  return new;
end;
$$;
drop trigger if exists payment_guard on payments;
create trigger payment_guard before update on payments
  for each row execute function public.payment_guard();

alter table payments enable row level security;
drop policy if exists payments_read on payments;
create policy payments_read on payments for select to authenticated
  using (has_perm(org_id, 'finance.manage') or has_perm(org_id, 'campaign.manage') or talent_id = my_talent_id());
drop policy if exists payments_update on payments;
create policy payments_update on payments for update to authenticated
  using (has_perm(org_id, 'finance.manage')) with check (has_perm(org_id, 'finance.manage'));

-- ---------------------------------------------------------------------------
-- Brand invoices
-- ---------------------------------------------------------------------------
do $$ begin
  create type invoice_status as enum ('draft', 'sent', 'paid', 'void');
exception when duplicate_object then null; end $$;

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  number text not null,
  label text,
  amount int not null check (amount > 0),   -- before GST
  gst_pct numeric(4, 2) not null default 18,
  status invoice_status not null default 'draft',
  issued_on date not null default current_date,
  due_date date,
  paid_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, number)
);
create index if not exists invoices_campaign_idx on invoices (campaign_id);

create or replace function public.invoice_prepare()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select org_id into new.org_id from campaigns where id = new.campaign_id;
  if new.status = 'paid' then new.paid_at := coalesce(new.paid_at, now()); end if;
  return new;
end;
$$;
drop trigger if exists invoice_prepare on invoices;
create trigger invoice_prepare before insert or update on invoices
  for each row execute function public.invoice_prepare();

alter table invoices enable row level security;
drop policy if exists invoices_read on invoices;
create policy invoices_read on invoices for select to authenticated
  using (has_perm(org_id, 'finance.manage') or has_perm(org_id, 'campaign.manage'));
drop policy if exists invoices_write on invoices;
create policy invoices_write on invoices for all to authenticated
  using (has_perm(org_id, 'finance.manage')) with check (has_perm(org_id, 'finance.manage'));

-- ---------------------------------------------------------------------------
-- Booking side effects: a confirmed intent gets a deliverable and a payout row
-- ---------------------------------------------------------------------------
create or replace function public.intent_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if new.stage not in ('confirmed', 'delivered') then
    return new;
  end if;
  select br.talent_kind, br.deliverables, br.event_date, br.campaign_id, c.end_date
    into b from briefs br join campaigns c on c.id = br.campaign_id where br.id = new.brief_id;

  if not exists (select 1 from deliverables where intent_id = new.id) then
    insert into deliverables (intent_id, org_id, campaign_id, talent_id, kind, title, due_date, status, live_url, posted_at)
    values (
      new.id, new.org_id, b.campaign_id, new.talent_id,
      case when b.talent_kind = 'event' then 'Event' else 'Reel' end,
      b.deliverables,
      coalesce(b.event_date, b.end_date),
      case when new.stage = 'delivered' then 'live'::deliverable_status else 'brief_sent'::deliverable_status end,
      case when new.stage = 'delivered' then new.deliverable_links[1] end,
      case when new.stage = 'delivered' then now() end
    );
  end if;

  insert into payments (org_id, intent_id, campaign_id, talent_id, amount, due_date)
  values (new.org_id, new.id, b.campaign_id, new.talent_id, coalesce(new.agreed_rate, new.quoted_rate, 0),
          coalesce(b.event_date, b.end_date, current_date) + 15)
  on conflict (intent_id) do update set amount = excluded.amount
    where payments.status = 'pending' and payments.amount is distinct from excluded.amount;
  return new;
end;
$$;
drop trigger if exists intent_booking on intents;
create trigger intent_booking after insert or update of stage, agreed_rate on intents
  for each row execute function public.intent_booking();

-- Backfill bookings that already exist.
update intents set stage = stage where stage in ('confirmed', 'delivered');

-- ---------------------------------------------------------------------------
-- Draft uploads: private bucket, path "<deliverable_id>/<file>"
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deliverables', 'deliverables', false, 524288000, array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create or replace function public.can_see_deliverable(p_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from deliverables d left join campaigns c on c.id = d.campaign_id
    where d.id::text = p_id and (
      has_perm(d.org_id, 'talent.view') or d.talent_id = my_talent_id()
      or (d.brand_visible and c.brand_org_id is not null and has_perm(c.brand_org_id, 'brand.view'))
    )
  );
$$;

drop policy if exists deliverable_files_read on storage.objects;
create policy deliverable_files_read on storage.objects for select to authenticated
  using (bucket_id = 'deliverables' and public.can_see_deliverable((storage.foldername(name))[1]));
drop policy if exists deliverable_files_upload on storage.objects;
create policy deliverable_files_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'deliverables' and exists (
    select 1 from public.deliverables d
    where d.id::text = (storage.foldername(name))[1] and d.talent_id = public.my_talent_id()
  ));

-- ---------------------------------------------------------------------------
-- Workflow functions (called from server actions with the user's session)
-- ---------------------------------------------------------------------------

-- Creator submits a new draft version.
create or replace function public.submit_deliverable(p_id uuid, p_caption text, p_media_url text, p_storage_path text, p_note text default null)
returns int language plpgsql security definer set search_path = public as $$
declare d deliverables; v int;
begin
  select * into d from deliverables where id = p_id for update;
  if d.id is null or d.talent_id is distinct from my_talent_id() then
    raise exception 'Not your deliverable' using errcode = '42501';
  end if;
  if d.status in ('approved', 'live') then
    raise exception 'This deliverable is already approved' using errcode = '22023';
  end if;
  if coalesce(trim(p_media_url), '') = '' and coalesce(trim(p_storage_path), '') = '' then
    raise exception 'Attach a file or paste a link' using errcode = '22023';
  end if;
  if p_media_url is not null and p_media_url !~* '^https?://[^ ]+\.[^ ]+' then
    raise exception 'That link does not look right' using errcode = '22023';
  end if;
  if p_storage_path is not null and split_part(p_storage_path, '/', 1) <> p_id::text then
    raise exception 'Upload path does not match the deliverable' using errcode = '22023';
  end if;
  select coalesce(max(version), 0) + 1 into v from deliverable_versions where deliverable_id = p_id;
  insert into deliverable_versions (deliverable_id, version, caption, media_url, storage_path, created_by)
  values (p_id, v, nullif(trim(p_caption), ''), nullif(trim(p_media_url), ''), nullif(trim(p_storage_path), ''), auth.uid());
  if coalesce(trim(p_note), '') <> '' then
    insert into deliverable_comments (deliverable_id, version, author_id, author_role, body)
    values (p_id, v, auth.uid(), 'creator', left(trim(p_note), 2000));
  end if;
  update deliverables set status = 'draft_submitted' where id = p_id;
  return v;
end;
$$;

-- Creator (or agency) records the live post once the draft is approved.
create or replace function public.submit_live_link(p_id uuid, p_url text)
returns void language plpgsql security definer set search_path = public as $$
declare d deliverables;
begin
  select * into d from deliverables where id = p_id for update;
  if d.id is null or not (d.talent_id = my_talent_id() or has_perm(d.org_id, 'pipeline.manage')) then
    raise exception 'Not your deliverable' using errcode = '42501';
  end if;
  if d.status not in ('approved', 'live') then
    raise exception 'Post only after the draft is approved' using errcode = '22023';
  end if;
  if p_url !~* '^https?://(www\.)?(instagram\.com|youtube\.com|youtu\.be)/' then
    raise exception 'Paste the Instagram or YouTube link of the live post' using errcode = '22023';
  end if;
  update deliverables set live_url = trim(p_url), status = 'live', posted_at = coalesce(posted_at, now()) where id = p_id;
end;
$$;

-- Review decision or comment from the agency or the brand.
create or replace function public.review_deliverable(p_id uuid, p_decision text, p_body text, p_internal boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare d deliverables; who text; v int; brand_org uuid;
begin
  select * into d from deliverables where id = p_id for update;
  if d.id is null then raise exception 'Unknown deliverable' using errcode = '22023'; end if;
  select brand_org_id into brand_org from campaigns where id = d.campaign_id;
  if has_perm(d.org_id, 'pipeline.manage') then
    who := 'agency';
  elsif d.brand_visible and brand_org is not null and has_perm(brand_org, 'brand.approve') then
    who := 'brand';
  else
    raise exception 'You cannot review this deliverable' using errcode = '42501';
  end if;
  if p_decision not in ('approve', 'changes', 'comment') then
    raise exception 'Unknown decision' using errcode = '22023';
  end if;
  if p_decision = 'changes' and coalesce(trim(p_body), '') = '' then
    raise exception 'Say what needs to change' using errcode = '22023';
  end if;
  if p_decision <> 'comment' and d.status not in ('draft_submitted', 'changes_requested', 'approved') then
    raise exception 'There is no draft to review yet' using errcode = '22023';
  end if;
  select max(version) into v from deliverable_versions where deliverable_id = p_id;
  insert into deliverable_comments (deliverable_id, version, author_id, author_role, decision, internal, body)
  values (p_id, v, auth.uid(), who,
    case p_decision when 'approve' then 'approved' when 'changes' then 'changes' end,
    who = 'agency' and coalesce(p_internal, false),
    coalesce(nullif(left(trim(p_body), 4000), ''), case when p_decision = 'approve' then 'Approved. Good to post.' else '' end));
  if p_decision = 'approve' then
    update deliverables set status = 'approved' where id = p_id;
  elsif p_decision = 'changes' then
    update deliverables set status = 'changes_requested' where id = p_id;
  end if;
  return who;
end;
$$;

-- Brand approves / passes / asks about a shared shortlist entry.
create or replace function public.brand_decide(p_intent uuid, p_decision text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare i record;
begin
  select it.id, it.org_id, it.shared_with_brand_at, c.brand_org_id into i
  from intents it join briefs b on b.id = it.brief_id join campaigns c on c.id = b.campaign_id where it.id = p_intent;
  if i.id is null or i.shared_with_brand_at is null or i.brand_org_id is null or not has_perm(i.brand_org_id, 'brand.approve') then
    raise exception 'This creator is not on a shortlist shared with you' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'passed', 'question') then
    raise exception 'Unknown decision' using errcode = '22023';
  end if;
  insert into shortlist_decisions (intent_id, org_id, decision, note, decided_by, decided_at)
  values (p_intent, i.org_id, p_decision, nullif(left(trim(p_note), 1000), ''), auth.uid(), now())
  on conflict (intent_id) do update set decision = excluded.decision, note = excluded.note, decided_by = excluded.decided_by, decided_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Brand-safe read functions
-- ---------------------------------------------------------------------------
create or replace function public.brand_campaigns()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(row_to_json(x) order by x.start_date desc nulls last), '[]'::jsonb) from (
    select c.id, c.name, c.brand_name, c.status, c.start_date, c.end_date, c.go_live, c.budget, c.creators_target,
      c.reach_target, c.views_target, c.er_target, o.name as agency_name,
      (select p.full_name from profiles p where p.id = c.owner_id) as owner_name,
      (select coalesce(array_agg(distinct city), '{}') from briefs b, unnest(b.cities) city where b.campaign_id = c.id) as cities,
      (select count(*) from intents i join briefs b on b.id = i.brief_id where b.campaign_id = c.id and i.stage in ('confirmed', 'delivered')) as confirmed,
      (select coalesce(sum(i.brand_fee), 0) from intents i join briefs b on b.id = i.brief_id where b.campaign_id = c.id and i.stage in ('confirmed', 'delivered')) as committed,
      (select count(*) from deliverables d where d.campaign_id = c.id) as deliverables_total,
      (select count(*) from deliverables d where d.campaign_id = c.id and d.status = 'live') as deliverables_live,
      (select coalesce(sum(d.views), 0) from deliverables d where d.campaign_id = c.id and d.status = 'live') as views,
      (select coalesce(sum(coalesce(d.likes, 0) + coalesce(d.comments, 0)), 0) from deliverables d where d.campaign_id = c.id and d.status = 'live') as engagements,
      (select count(*) from intents i join briefs b on b.id = i.brief_id
         where b.campaign_id = c.id and i.shared_with_brand_at is not null and i.stage not in ('rejected', 'dropped')
           and not exists (select 1 from shortlist_decisions s where s.intent_id = i.id)) as shortlist_pending,
      (select count(*) from intents i join briefs b on b.id = i.brief_id
         where b.campaign_id = c.id and i.shared_with_brand_at is not null) as shortlist_total,
      (select count(*) from deliverables d where d.campaign_id = c.id and d.brand_visible and d.status = 'draft_submitted') as reviews_pending,
      (select min(d.updated_at) from deliverables d where d.campaign_id = c.id and d.brand_visible and d.status = 'draft_submitted') as oldest_review_at
    from campaigns c join organizations o on o.id = c.org_id
    where c.brand_org_id is not null and has_perm(c.brand_org_id, 'brand.view') and c.status <> 'archived'
  ) x;
$$;

create or replace function public.brand_shortlist(p_campaign uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare res jsonb;
begin
  if not exists (select 1 from campaigns c where c.id = p_campaign and c.brand_org_id is not null and has_perm(c.brand_org_id, 'brand.view')) then
    raise exception 'Campaign not found' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.shared_at), '[]'::jsonb) into res from (
    select i.id as intent_id, t.id as talent_id, t.display_name as name, t.city, t.rank, t.categories, t.reliability_score as reliability,
      t.is_influencer, t.is_event_talent, t.bio,
      i.brand_fee as fee, i.shared_with_brand_at as shared_at, i.stage,
      b.id as brief_id, b.title as brief_title, b.deliverables as brief_deliverables, b.cities as brief_cities,
      b.categories as brief_categories, b.talent_kind as brief_kind, b.min_followers, b.max_followers, b.min_engagement,
      e.college_name as college, e.graduation_year as grad_year,
      s.handle, s.followers, s.engagement_rate as er, s.avg_views, s.avg_likes, s.is_verified as verified, s.profile_pic_url,
      (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'type', p.post_type, 'views', p.views, 'likes', p.likes, 'thumb', p.thumbnail_url, 'url', p.url) order by p.posted_at desc), '[]'::jsonb)
         from (select * from social_posts p where p.account_id = s.id order by p.posted_at desc nulls last limit 3) p) as posts,
      (select count(*) from intents i2 where i2.talent_id = t.id and i2.stage = 'delivered') as past_bookings,
      d.decision, d.note as decision_note, d.decided_at
    from intents i
      join briefs b on b.id = i.brief_id
      join talent_profiles t on t.id = i.talent_id
      left join talent_education e on e.talent_id = t.id
      left join lateral (select * from social_accounts sa where sa.talent_id = t.id and sa.platform = 'instagram' limit 1) s on true
      left join shortlist_decisions d on d.intent_id = i.id
    where b.campaign_id = p_campaign and i.shared_with_brand_at is not null and i.stage not in ('rejected', 'dropped')
  ) x;
  return res;
end;
$$;

create or replace function public.brand_content(p_campaign uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare res jsonb;
begin
  if not exists (select 1 from campaigns c where c.id = p_campaign and c.brand_org_id is not null and has_perm(c.brand_org_id, 'brand.view')) then
    raise exception 'Campaign not found' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.updated_at), '[]'::jsonb) into res from (
    select d.id, d.kind, d.title, d.status, d.due_date, d.brand_visible, d.live_url, d.posted_at, d.views, d.likes, d.comments, d.updated_at,
      t.display_name as name, t.city, s.handle, e.college_name as college,
      (select coalesce(jsonb_agg(jsonb_build_object('version', v.version, 'caption', v.caption, 'media_url', v.media_url, 'storage_path', v.storage_path, 'at', v.created_at) order by v.version), '[]'::jsonb)
         from deliverable_versions v where v.deliverable_id = d.id) as versions,
      (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'role', m.author_role, 'who', coalesce(p.full_name, initcap(m.author_role)), 'body', m.body, 'decision', m.decision, 'version', m.version, 'at', m.created_at) order by m.created_at), '[]'::jsonb)
         from deliverable_comments m left join profiles p on p.id = m.author_id where m.deliverable_id = d.id and not m.internal) as comments,
      (select coalesce(jsonb_agg(jsonb_build_object('views', dm.views, 'at', dm.captured_at) order by dm.captured_at), '[]'::jsonb)
         from deliverable_metrics dm where dm.deliverable_id = d.id) as metrics
    from deliverables d
      join talent_profiles t on t.id = d.talent_id
      left join talent_education e on e.talent_id = t.id
      left join lateral (select handle from social_accounts sa where sa.talent_id = t.id and sa.platform = 'instagram' limit 1) s on true
    where d.campaign_id = p_campaign and (d.brand_visible or d.status = 'live')
  ) x;
  return res;
end;
$$;

revoke execute on function public.brand_campaigns() from anon;
revoke execute on function public.brand_shortlist(uuid) from anon;
revoke execute on function public.brand_content(uuid) from anon;
revoke execute on function public.brand_decide(uuid, text, text) from anon;
revoke execute on function public.review_deliverable(uuid, text, text, boolean) from anon;
revoke execute on function public.submit_deliverable(uuid, text, text, text, text) from anon;
revoke execute on function public.submit_live_link(uuid, text) from anon;
