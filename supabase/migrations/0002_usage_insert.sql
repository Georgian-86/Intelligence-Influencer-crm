-- Allow org members to log usage events for their own org (e.g. pool exports).
create policy usage_insert on usage_events for insert to authenticated
  with check (is_org_member(org_id) and (actor is null or actor = auth.uid()));
