-- Lawn Hoppers Supabase schema for production MVP
-- Run this in Supabase SQL Editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text not null,
  notes text,
  lifetime_value numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  service text not null,
  preferred_date date,
  notes text,
  estimate numeric not null default 0,
  status text not null default 'new' check (status in ('new','approved','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  service text not null,
  amount numeric not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','approved','declined')),
  sent_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  service text not null,
  job_date date not null,
  job_time text,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  price numeric not null default 0,
  crew text,
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  amount numeric not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','paid','void')),
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.service_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.jobs enable row level security;
alter table public.invoices enable row level security;

-- Public customers can only submit booking requests.
drop policy if exists "public can create requests" on public.service_requests;
create policy "public can create requests"
  on public.service_requests
  for insert
  to anon
  with check (true);

-- Authenticated owner/admin can manage all MVP records.
drop policy if exists "authenticated manage clients" on public.clients;
create policy "authenticated manage clients"
  on public.clients
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated manage requests" on public.service_requests;
create policy "authenticated manage requests"
  on public.service_requests
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated manage quotes" on public.quotes;
create policy "authenticated manage quotes"
  on public.quotes
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated manage jobs" on public.jobs;
create policy "authenticated manage jobs"
  on public.jobs
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated manage invoices" on public.invoices;
create policy "authenticated manage invoices"
  on public.invoices
  for all
  to authenticated
  using (true)
  with check (true);
