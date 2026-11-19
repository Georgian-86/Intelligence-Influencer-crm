-- v2 onboarding: college graph (PRD A3) + talent education.
-- Idempotent: safe to re-run; parts may already exist on the live project.

-- ---------------------------------------------------------------------------
-- Colleges (public directory)
-- ---------------------------------------------------------------------------
create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text,
  type text check (type in ('university', 'college', 'institute')),
  aishe_code text,
  created_at timestamptz not null default now()
);
alter table public.colleges add column if not exists aishe_code text;

create unique index if not exists colleges_name_city_key on public.colleges (lower(name), city);
create unique index if not exists colleges_aishe_code_key on public.colleges (aishe_code) where aishe_code is not null;
create index if not exists colleges_city_idx on public.colleges (city);
-- Prefix search ("st. xav…") works on this btree; contains search uses the trigram index below.
create index if not exists colleges_lower_name_idx on public.colleges (lower(name) text_pattern_ops);

do $$
begin
  create extension if not exists pg_trgm;
  execute 'create index if not exists colleges_name_trgm_idx on public.colleges using gin (name gin_trgm_ops)';
exception when others then
  raise notice 'pg_trgm index skipped: %', sqlerrm;
end
$$;

alter table public.colleges enable row level security;
drop policy if exists colleges_read on public.colleges;
create policy colleges_read on public.colleges for select to anon, authenticated using (true);
drop policy if exists colleges_write on public.colleges;
create policy colleges_write on public.colleges for all to authenticated
  using (has_platform_perm('talent.approve')) with check (has_platform_perm('talent.approve'));

-- ---------------------------------------------------------------------------
-- Talent education (one current record per talent)
-- ---------------------------------------------------------------------------
create table if not exists public.talent_education (
  talent_id uuid primary key references public.talent_profiles (id) on delete cascade,
  college_id uuid references public.colleges (id) on delete set null,
  college_name text, -- free text when the college isn't in the directory yet
  course text,
  graduation_year int check (graduation_year between 1980 and 2100),
  college_email text,
  verified_at timestamptz, -- platform-controlled (college email verification badge)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.talent_education add column if not exists college_name text;
create index if not exists talent_education_college_idx on public.talent_education (college_id);
create index if not exists talent_education_year_idx on public.talent_education (graduation_year);

drop trigger if exists talent_education_touch on public.talent_education;
create trigger talent_education_touch before update on public.talent_education
  for each row execute function public.touch_updated_at();

-- Talent cannot verify themselves; changing the college email drops an existing verification.
create or replace function public.protect_education_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or has_platform_perm('talent.approve') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified_at := null;
  else
    new.verified_at := case
      when new.college_email is distinct from old.college_email then null
      else old.verified_at
    end;
  end if;
  return new;
end;
$$;
drop trigger if exists talent_education_protect on public.talent_education;
create trigger talent_education_protect before insert or update on public.talent_education
  for each row execute function public.protect_education_fields();

alter table public.talent_education enable row level security;

-- Mirrors talent_media / talent_contacts: visible wherever the talent is visible; talent writes own row.
drop policy if exists education_read on public.talent_education;
create policy education_read on public.talent_education for select to authenticated
  using (talent_id = my_talent_id() or can_see_talent(talent_id));
drop policy if exists education_write_self on public.talent_education;
create policy education_write_self on public.talent_education for all to authenticated
  using (talent_id = my_talent_id()) with check (talent_id = my_talent_id());
drop policy if exists education_platform_update on public.talent_education;
create policy education_platform_update on public.talent_education for update to authenticated
  using (has_platform_perm('talent.approve')) with check (has_platform_perm('talent.approve'));

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
-- BEGIN COLLEGE SEED (generated by scripts/seed-colleges.mjs; edit lib/colleges-data.ts instead)
insert into public.colleges (name, city, state, type) values
  ('Indian Institute of Technology Bombay', 'Mumbai', 'Maharashtra', 'institute'),
  ('University of Mumbai', 'Mumbai', 'Maharashtra', 'university'),
  ('St. Xavier''s College, Mumbai', 'Mumbai', 'Maharashtra', 'college'),
  ('Jai Hind College', 'Mumbai', 'Maharashtra', 'college'),
  ('H.R. College of Commerce and Economics', 'Mumbai', 'Maharashtra', 'college'),
  ('Narsee Monjee College of Commerce and Economics', 'Mumbai', 'Maharashtra', 'college'),
  ('Mithibai College', 'Mumbai', 'Maharashtra', 'college'),
  ('NMIMS (Narsee Monjee Institute of Management Studies)', 'Mumbai', 'Maharashtra', 'university'),
  ('K. J. Somaiya College of Engineering', 'Mumbai', 'Maharashtra', 'college'),
  ('Somaiya Vidyavihar University', 'Mumbai', 'Maharashtra', 'university'),
  ('Wilson College', 'Mumbai', 'Maharashtra', 'college'),
  ('Sophia College for Women', 'Mumbai', 'Maharashtra', 'college'),
  ('Ramnarain Ruia Autonomous College', 'Mumbai', 'Maharashtra', 'college'),
  ('R. A. Podar College of Commerce and Economics', 'Mumbai', 'Maharashtra', 'college'),
  ('K. C. College (Kishinchand Chellaram College)', 'Mumbai', 'Maharashtra', 'college'),
  ('D. G. Ruparel College', 'Mumbai', 'Maharashtra', 'college'),
  ('SNDT Women''s University', 'Mumbai', 'Maharashtra', 'university'),
  ('Institute of Chemical Technology', 'Mumbai', 'Maharashtra', 'institute'),
  ('Veermata Jijabai Technological Institute (VJTI)', 'Mumbai', 'Maharashtra', 'institute'),
  ('Sardar Patel Institute of Technology', 'Mumbai', 'Maharashtra', 'institute'),
  ('Tata Institute of Social Sciences', 'Mumbai', 'Maharashtra', 'institute'),
  ('Jamnalal Bajaj Institute of Management Studies', 'Mumbai', 'Maharashtra', 'institute'),
  ('National Institute of Fashion Technology, Mumbai', 'Mumbai', 'Maharashtra', 'institute'),
  ('Sir J. J. School of Art', 'Mumbai', 'Maharashtra', 'college'),
  ('Thakur College of Engineering and Technology', 'Mumbai', 'Maharashtra', 'college'),
  ('Lala Lajpat Rai College', 'Mumbai', 'Maharashtra', 'college'),
  ('St. Andrew''s College', 'Mumbai', 'Maharashtra', 'college'),
  ('D. Y. Patil University, Navi Mumbai', 'Navi Mumbai', 'Maharashtra', 'university'),
  ('University of Delhi', 'Delhi', 'Delhi', 'university'),
  ('Indian Institute of Technology Delhi', 'Delhi', 'Delhi', 'institute'),
  ('Jawaharlal Nehru University', 'Delhi', 'Delhi', 'university'),
  ('Jamia Millia Islamia', 'Delhi', 'Delhi', 'university'),
  ('Shri Ram College of Commerce', 'Delhi', 'Delhi', 'college'),
  ('St. Stephen''s College', 'Delhi', 'Delhi', 'college'),
  ('Hindu College', 'Delhi', 'Delhi', 'college'),
  ('Miranda House', 'Delhi', 'Delhi', 'college'),
  ('Lady Shri Ram College for Women', 'Delhi', 'Delhi', 'college'),
  ('Hansraj College', 'Delhi', 'Delhi', 'college'),
  ('Kirori Mal College', 'Delhi', 'Delhi', 'college'),
  ('Ramjas College', 'Delhi', 'Delhi', 'college'),
  ('Sri Venkateswara College', 'Delhi', 'Delhi', 'college'),
  ('Gargi College', 'Delhi', 'Delhi', 'college'),
  ('Kamala Nehru College', 'Delhi', 'Delhi', 'college'),
  ('Delhi Technological University', 'Delhi', 'Delhi', 'university'),
  ('Netaji Subhas University of Technology', 'Delhi', 'Delhi', 'university'),
  ('Indraprastha Institute of Information Technology Delhi', 'Delhi', 'Delhi', 'institute'),
  ('Guru Gobind Singh Indraprastha University', 'Delhi', 'Delhi', 'university'),
  ('National Institute of Fashion Technology, Delhi', 'Delhi', 'Delhi', 'institute'),
  ('Indian Institute of Mass Communication', 'Delhi', 'Delhi', 'institute'),
  ('Dr. B. R. Ambedkar University Delhi', 'Delhi', 'Delhi', 'university'),
  ('Indian Institute of Foreign Trade', 'Delhi', 'Delhi', 'institute'),
  ('Amity University, Noida', 'Noida', 'Uttar Pradesh', 'university'),
  ('Jaypee Institute of Information Technology', 'Noida', 'Uttar Pradesh', 'institute'),
  ('Shiv Nadar University', 'Greater Noida', 'Uttar Pradesh', 'university'),
  ('Bennett University', 'Greater Noida', 'Uttar Pradesh', 'university'),
  ('Sharda University', 'Greater Noida', 'Uttar Pradesh', 'university'),
  ('Galgotias University', 'Greater Noida', 'Uttar Pradesh', 'university'),
  ('Management Development Institute', 'Gurugram', 'Haryana', 'institute'),
  ('The NorthCap University', 'Gurugram', 'Haryana', 'university'),
  ('Ashoka University', 'Sonipat', 'Haryana', 'university'),
  ('O.P. Jindal Global University', 'Sonipat', 'Haryana', 'university'),
  ('Indian Institute of Science', 'Bangalore', 'Karnataka', 'institute'),
  ('Indian Institute of Management Bangalore', 'Bangalore', 'Karnataka', 'institute'),
  ('Christ University', 'Bangalore', 'Karnataka', 'university'),
  ('St. Joseph''s University', 'Bangalore', 'Karnataka', 'university'),
  ('St. Joseph''s College of Commerce', 'Bangalore', 'Karnataka', 'college'),
  ('Mount Carmel College', 'Bangalore', 'Karnataka', 'college'),
  ('Jyoti Nivas College', 'Bangalore', 'Karnataka', 'college'),
  ('Kristu Jayanti College', 'Bangalore', 'Karnataka', 'college'),
  ('R. V. College of Engineering', 'Bangalore', 'Karnataka', 'college'),
  ('B. M. S. College of Engineering', 'Bangalore', 'Karnataka', 'college'),
  ('PES University', 'Bangalore', 'Karnataka', 'university'),
  ('M. S. Ramaiah Institute of Technology', 'Bangalore', 'Karnataka', 'institute'),
  ('Bangalore University', 'Bangalore', 'Karnataka', 'university'),
  ('National Law School of India University', 'Bangalore', 'Karnataka', 'university'),
  ('Jain University', 'Bangalore', 'Karnataka', 'university'),
  ('Dayananda Sagar University', 'Bangalore', 'Karnataka', 'university'),
  ('Srishti Manipal Institute of Art, Design and Technology', 'Bangalore', 'Karnataka', 'institute'),
  ('National Institute of Fashion Technology, Bengaluru', 'Bangalore', 'Karnataka', 'institute'),
  ('International Institute of Information Technology Bangalore', 'Bangalore', 'Karnataka', 'institute'),
  ('Presidency University, Bengaluru', 'Bangalore', 'Karnataka', 'university'),
  ('REVA University', 'Bangalore', 'Karnataka', 'university'),
  ('Alliance University', 'Bangalore', 'Karnataka', 'university'),
  ('Savitribai Phule Pune University', 'Pune', 'Maharashtra', 'university'),
  ('Fergusson College', 'Pune', 'Maharashtra', 'college'),
  ('Symbiosis International University', 'Pune', 'Maharashtra', 'university'),
  ('Symbiosis College of Arts and Commerce', 'Pune', 'Maharashtra', 'college'),
  ('Symbiosis Institute of Business Management', 'Pune', 'Maharashtra', 'institute'),
  ('COEP Technological University', 'Pune', 'Maharashtra', 'university'),
  ('MIT World Peace University', 'Pune', 'Maharashtra', 'university'),
  ('Brihan Maharashtra College of Commerce', 'Pune', 'Maharashtra', 'college'),
  ('FLAME University', 'Pune', 'Maharashtra', 'university'),
  ('Vishwakarma Institute of Technology', 'Pune', 'Maharashtra', 'institute'),
  ('Pune Institute of Computer Technology', 'Pune', 'Maharashtra', 'institute'),
  ('Dr. D. Y. Patil Vidyapeeth, Pune', 'Pune', 'Maharashtra', 'university'),
  ('Film and Television Institute of India', 'Pune', 'Maharashtra', 'institute'),
  ('ILS Law College', 'Pune', 'Maharashtra', 'college'),
  ('Bharati Vidyapeeth', 'Pune', 'Maharashtra', 'university'),
  ('University of Hyderabad', 'Hyderabad', 'Telangana', 'university'),
  ('Osmania University', 'Hyderabad', 'Telangana', 'university'),
  ('Indian Institute of Technology Hyderabad', 'Hyderabad', 'Telangana', 'institute'),
  ('International Institute of Information Technology Hyderabad', 'Hyderabad', 'Telangana', 'institute'),
  ('Indian School of Business', 'Hyderabad', 'Telangana', 'institute'),
  ('NALSAR University of Law', 'Hyderabad', 'Telangana', 'university'),
  ('Jawaharlal Nehru Technological University Hyderabad', 'Hyderabad', 'Telangana', 'university'),
  ('St. Francis College for Women', 'Hyderabad', 'Telangana', 'college'),
  ('Loyola Academy', 'Hyderabad', 'Telangana', 'college'),
  ('Chaitanya Bharathi Institute of Technology', 'Hyderabad', 'Telangana', 'institute'),
  ('Vasavi College of Engineering', 'Hyderabad', 'Telangana', 'college'),
  ('BITS Pilani, Hyderabad Campus', 'Hyderabad', 'Telangana', 'institute'),
  ('Mahindra University', 'Hyderabad', 'Telangana', 'university'),
  ('National Institute of Fashion Technology, Hyderabad', 'Hyderabad', 'Telangana', 'institute'),
  ('Woxsen University', 'Hyderabad', 'Telangana', 'university'),
  ('Indian Institute of Technology Madras', 'Chennai', 'Tamil Nadu', 'institute'),
  ('Anna University', 'Chennai', 'Tamil Nadu', 'university'),
  ('University of Madras', 'Chennai', 'Tamil Nadu', 'university'),
  ('Loyola College, Chennai', 'Chennai', 'Tamil Nadu', 'college'),
  ('Madras Christian College', 'Chennai', 'Tamil Nadu', 'college'),
  ('Stella Maris College', 'Chennai', 'Tamil Nadu', 'college'),
  ('Women''s Christian College', 'Chennai', 'Tamil Nadu', 'college'),
  ('Ethiraj College for Women', 'Chennai', 'Tamil Nadu', 'college'),
  ('Presidency College, Chennai', 'Chennai', 'Tamil Nadu', 'college'),
  ('SRM Institute of Science and Technology', 'Chennai', 'Tamil Nadu', 'university'),
  ('Sathyabama Institute of Science and Technology', 'Chennai', 'Tamil Nadu', 'university'),
  ('Vellore Institute of Technology, Chennai', 'Chennai', 'Tamil Nadu', 'university'),
  ('Sri Sivasubramaniya Nadar College of Engineering', 'Chennai', 'Tamil Nadu', 'college'),
  ('Asian College of Journalism', 'Chennai', 'Tamil Nadu', 'institute'),
  ('National Institute of Fashion Technology, Chennai', 'Chennai', 'Tamil Nadu', 'institute'),
  ('Jadavpur University', 'Kolkata', 'West Bengal', 'university'),
  ('University of Calcutta', 'Kolkata', 'West Bengal', 'university'),
  ('Presidency University, Kolkata', 'Kolkata', 'West Bengal', 'university'),
  ('St. Xavier''s College, Kolkata', 'Kolkata', 'West Bengal', 'college'),
  ('Indian Institute of Management Calcutta', 'Kolkata', 'West Bengal', 'institute'),
  ('Loreto College, Kolkata', 'Kolkata', 'West Bengal', 'college'),
  ('Scottish Church College', 'Kolkata', 'West Bengal', 'college'),
  ('Bethune College', 'Kolkata', 'West Bengal', 'college'),
  ('Asutosh College', 'Kolkata', 'West Bengal', 'college'),
  ('Indian Statistical Institute', 'Kolkata', 'West Bengal', 'institute'),
  ('Heritage Institute of Technology', 'Kolkata', 'West Bengal', 'institute'),
  ('Techno India University', 'Kolkata', 'West Bengal', 'university'),
  ('National Institute of Fashion Technology, Kolkata', 'Kolkata', 'West Bengal', 'institute'),
  ('Indian Institute of Management Ahmedabad', 'Ahmedabad', 'Gujarat', 'institute'),
  ('National Institute of Design', 'Ahmedabad', 'Gujarat', 'institute'),
  ('CEPT University', 'Ahmedabad', 'Gujarat', 'university'),
  ('Gujarat University', 'Ahmedabad', 'Gujarat', 'university'),
  ('Nirma University', 'Ahmedabad', 'Gujarat', 'university'),
  ('Ahmedabad University', 'Ahmedabad', 'Gujarat', 'university'),
  ('St. Xavier''s College, Ahmedabad', 'Ahmedabad', 'Gujarat', 'college'),
  ('H. L. College of Commerce', 'Ahmedabad', 'Gujarat', 'college'),
  ('MICA', 'Ahmedabad', 'Gujarat', 'institute'),
  ('L. D. College of Engineering', 'Ahmedabad', 'Gujarat', 'college'),
  ('Indian Institute of Technology Gandhinagar', 'Gandhinagar', 'Gujarat', 'institute'),
  ('Dhirubhai Ambani Institute of Information and Communication Technology', 'Gandhinagar', 'Gujarat', 'institute'),
  ('National Institute of Fashion Technology, Gandhinagar', 'Gandhinagar', 'Gujarat', 'institute'),
  ('University of Rajasthan', 'Jaipur', 'Rajasthan', 'university'),
  ('Malaviya National Institute of Technology', 'Jaipur', 'Rajasthan', 'institute'),
  ('Manipal University Jaipur', 'Jaipur', 'Rajasthan', 'university'),
  ('St. Xavier''s College, Jaipur', 'Jaipur', 'Rajasthan', 'college'),
  ('JECRC University', 'Jaipur', 'Rajasthan', 'university'),
  ('Poornima University', 'Jaipur', 'Rajasthan', 'university'),
  ('IIS (deemed to be University)', 'Jaipur', 'Rajasthan', 'university'),
  ('Amity University, Jaipur', 'Jaipur', 'Rajasthan', 'university'),
  ('Kanoria PG Mahila Mahavidyalaya', 'Jaipur', 'Rajasthan', 'college'),
  ('The LNM Institute of Information Technology', 'Jaipur', 'Rajasthan', 'institute'),
  ('Panjab University', 'Chandigarh', 'Chandigarh', 'university'),
  ('Punjab Engineering College', 'Chandigarh', 'Chandigarh', 'institute'),
  ('Post Graduate Government College, Sector 11', 'Chandigarh', 'Chandigarh', 'college'),
  ('DAV College, Chandigarh', 'Chandigarh', 'Chandigarh', 'college'),
  ('MCM DAV College for Women', 'Chandigarh', 'Chandigarh', 'college'),
  ('Government College of Art, Chandigarh', 'Chandigarh', 'Chandigarh', 'college'),
  ('Chandigarh University', 'Mohali', 'Punjab', 'university'),
  ('Indian Institute of Science Education and Research Mohali', 'Mohali', 'Punjab', 'institute'),
  ('Chitkara University', 'Rajpura', 'Punjab', 'university'),
  ('Indian Institute of Management Indore', 'Indore', 'Madhya Pradesh', 'institute'),
  ('Indian Institute of Technology Indore', 'Indore', 'Madhya Pradesh', 'institute'),
  ('Devi Ahilya Vishwavidyalaya', 'Indore', 'Madhya Pradesh', 'university'),
  ('Shri Govindram Seksaria Institute of Technology and Science', 'Indore', 'Madhya Pradesh', 'institute'),
  ('Medi-Caps University', 'Indore', 'Madhya Pradesh', 'university'),
  ('Prestige Institute of Management and Research', 'Indore', 'Madhya Pradesh', 'institute'),
  ('Symbiosis University of Applied Sciences', 'Indore', 'Madhya Pradesh', 'university'),
  ('University of Lucknow', 'Lucknow', 'Uttar Pradesh', 'university'),
  ('Indian Institute of Management Lucknow', 'Lucknow', 'Uttar Pradesh', 'institute'),
  ('Amity University, Lucknow', 'Lucknow', 'Uttar Pradesh', 'university'),
  ('Babasaheb Bhimrao Ambedkar University', 'Lucknow', 'Uttar Pradesh', 'university'),
  ('Isabella Thoburn College', 'Lucknow', 'Uttar Pradesh', 'college'),
  ('Integral University', 'Lucknow', 'Uttar Pradesh', 'university'),
  ('Dr. Ram Manohar Lohiya National Law University', 'Lucknow', 'Uttar Pradesh', 'university'),
  ('Institute of Engineering and Technology, Lucknow', 'Lucknow', 'Uttar Pradesh', 'institute'),
  ('National PG College, Lucknow', 'Lucknow', 'Uttar Pradesh', 'college'),
  ('Goa University', 'Goa', 'Goa', 'university'),
  ('BITS Pilani, K K Birla Goa Campus', 'Goa', 'Goa', 'institute'),
  ('Goa Institute of Management', 'Goa', 'Goa', 'institute'),
  ('Goa College of Engineering', 'Goa', 'Goa', 'college'),
  ('Dhempe College of Arts and Science', 'Goa', 'Goa', 'college')
on conflict do nothing;
-- END COLLEGE SEED
