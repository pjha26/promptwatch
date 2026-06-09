-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  site_url text not null,
  site_name text not null,
  api_key text unique not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table public.ai_visits (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  engine text not null,
  path text not null,
  timestamp timestamptz default now()
);

create table public.actions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  title text not null,
  category text not null,
  status text check (status in ('pending', 'accepted', 'dismissed')) default 'pending',
  created_at timestamptz default now()
);

create table public.prompts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  text text not null,
  status text default 'active',
  engines text[] default '{}',
  last_checked timestamptz default now(),
  created_at timestamptz default now()
);

create table public.competitors (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  name text not null,
  citations integer default 0,
  trend text check (trend in ('up', 'down', 'flat')) default 'flat',
  created_at timestamptz default now()
);

-- Turn on Row Level Security (RLS)
alter table public.workspaces enable row level security;
alter table public.ai_visits enable row level security;
alter table public.actions enable row level security;
alter table public.prompts enable row level security;
alter table public.competitors enable row level security;

-- Create Policies (Only users who own the workspace can see/edit its data)
create policy "Users can manage their own workspaces"
  on public.workspaces for all
  using (auth.uid() = user_id);

create policy "Users can manage visits for their workspaces"
  on public.ai_visits for all
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));

create policy "Users can manage actions for their workspaces"
  on public.actions for all
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));

create policy "Users can manage prompts for their workspaces"
  on public.prompts for all
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));

create policy "Users can manage competitors for their workspaces"
  on public.competitors for all
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
