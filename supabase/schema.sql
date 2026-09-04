-- HireLens AI — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to create all tables and RLS policies.

-- ─────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- WORKSPACES
-- ─────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.workspaces enable row level security;

create policy "Users can view workspaces they own"
  on public.workspaces for select
  using (auth.uid() = owner_id);

create policy "Users can create their own workspace"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own workspace"
  on public.workspaces for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own workspace"
  on public.workspaces for delete
  using (auth.uid() = owner_id);

-- Auto-create workspace on profile creation
create or replace function public.handle_new_profile()
returns trigger as $$
declare
  ws_id uuid;
begin
  insert into public.workspaces (name, owner_id)
  values (coalesce(new.full_name, 'My') || '''s Workspace', new.id)
  returning id into ws_id;

  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ─────────────────────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  company text,
  department text,
  location text,
  work_mode text default 'remote' check (work_mode in ('remote', 'hybrid', 'onsite')),
  employment_type text default 'full-time' check (employment_type in ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
  salary_min numeric,
  salary_max numeric,
  salary_currency text default 'USD',
  description text,
  required_skills jsonb default '[]'::jsonb,
  preferred_skills jsonb default '[]'::jsonb,
  min_years_experience integer,
  education_requirement jsonb,
  certification_requirements jsonb default '[]'::jsonb,
  seniority_target text,
  keywords jsonb default '[]'::jsonb,
  domains jsonb default '[]'::jsonb,
  responsibilities jsonb default '[]'::jsonb,
  status text default 'active' check (status in ('draft', 'active', 'paused', 'closed')),
  source_length integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.jobs enable row level security;

create policy "Users can manage jobs in their workspace"
  on public.jobs for all
  using (workspace_id in (
    select id from public.workspaces where owner_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────
-- CANDIDATES
-- ─────────────────────────────────────────────────────────
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_name text,
  resume_data jsonb not null default '{}'::jsonb,
  status text default 'new' check (status in ('new', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.candidates enable row level security;

create policy "Users can manage candidates in their workspace"
  on public.candidates for all
  using (workspace_id in (
    select id from public.workspaces where owner_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────
-- SCREENING RESULTS
-- ─────────────────────────────────────────────────────────
create table if not exists public.screening_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  match_data jsonb not null default '{}'::jsonb,
  ai_insight jsonb,
  ai_error text,
  created_at timestamptz default now() not null
);

alter table public.screening_results enable row level security;

create policy "Users can manage screening results in their workspace"
  on public.screening_results for all
  using (workspace_id in (
    select id from public.workspaces where owner_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────
-- CANDIDATE NOTES
-- ─────────────────────────────────────────────────────────
create table if not exists public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  text text not null,
  created_at timestamptz default now() not null
);

alter table public.candidate_notes enable row level security;

create policy "Users can manage notes in their workspace"
  on public.candidate_notes for all
  using (workspace_id in (
    select id from public.workspaces where owner_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────
-- CANDIDATE ACTIVITY
-- ─────────────────────────────────────────────────────────
create table if not exists public.candidate_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('screen', 'job-created', 'note', 'status-change')),
  message text not null,
  created_at timestamptz default now() not null
);

alter table public.candidate_activity enable row level security;

create policy "Users can manage activity in their workspace"
  on public.candidate_activity for all
  using (workspace_id in (
    select id from public.workspaces where owner_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
create index if not exists idx_jobs_workspace on public.jobs(workspace_id);
create index if not exists idx_candidates_workspace on public.candidates(workspace_id);
create index if not exists idx_screening_candidate on public.screening_results(candidate_id);
create index if not exists idx_screening_job on public.screening_results(job_id);
create index if not exists idx_screening_workspace on public.screening_results(workspace_id);
create index if not exists idx_notes_candidate on public.candidate_notes(candidate_id);
create index if not exists idx_activity_workspace on public.candidate_activity(workspace_id);
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
