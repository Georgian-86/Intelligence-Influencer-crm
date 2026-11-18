-- Deleting a user (e.g. a staff member who leaves) must not be blocked by audit references.
alter table talent_profiles drop constraint talent_profiles_reviewed_by_fkey,
  add constraint talent_profiles_reviewed_by_fkey foreign key (reviewed_by) references profiles (id) on delete set null;
alter table campaigns drop constraint campaigns_created_by_fkey,
  add constraint campaigns_created_by_fkey foreign key (created_by) references profiles (id) on delete set null;
alter table briefs drop constraint briefs_created_by_fkey,
  add constraint briefs_created_by_fkey foreign key (created_by) references profiles (id) on delete set null;
alter table notes drop constraint notes_author_id_fkey,
  add constraint notes_author_id_fkey foreign key (author_id) references profiles (id) on delete set null;
alter table pipeline_events drop constraint pipeline_events_actor_fkey,
  add constraint pipeline_events_actor_fkey foreign key (actor) references profiles (id) on delete set null;
