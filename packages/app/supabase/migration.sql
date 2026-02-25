-- TACIT Protocol Social App — Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  did text unique not null,
  public_key_hex text not null,
  display_name text not null,
  bio text,
  avatar_url text,
  domain text default 'professional',
  seeking text,
  offering text,
  trust_score integer default 0,
  trust_level text default 'new',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- OAuth credentials (verified external accounts)
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null,
  provider_user_id text not null,
  provider_email text,
  provider_name text,
  account_created_at timestamptz,
  credential_type text not null,
  credential_json jsonb not null,
  verified_at timestamptz default now(),
  unique(user_id, provider)
);

-- Active intents
create table if not exists public.intents (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  did text not null,
  intent_type text not null,
  domain text not null,
  seeking jsonb not null,
  context jsonb default '{}',
  filters jsonb default '{}',
  privacy_level text default 'filtered',
  ttl_seconds integer default 604800,
  signature text not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- Matches
create table if not exists public.matches (
  id text primary key,
  initiator_did text not null,
  responder_did text not null,
  score_overall integer not null,
  score_breakdown jsonb not null,
  initiator_user_id uuid references public.profiles(id),
  responder_user_id uuid references public.profiles(id),
  status text default 'pending',
  created_at timestamptz default now()
);

-- Introduction proposals
create table if not exists public.proposals (
  id text primary key,
  match_id text references public.matches(id),
  initiator_did text not null,
  responder_did text not null,
  initiator_user_id uuid references public.profiles(id),
  responder_user_id uuid references public.profiles(id),
  proposal_json jsonb not null,
  status text default 'pending',
  reveal_stage text default 'domain_context',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages within an accepted introduction
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id text references public.proposals(id) on delete cascade not null,
  sender_did text not null,
  sender_user_id uuid references public.profiles(id),
  content_encrypted text not null,
  reveal_stage text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.credentials enable row level security;
alter table public.intents enable row level security;
alter table public.matches enable row level security;
alter table public.proposals enable row level security;
alter table public.messages enable row level security;

-- RLS Policies

-- Profiles: everyone can read, only own profile can update
create policy "Public profiles visible to all" on public.profiles
  for select using (true);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Credentials: only owner can see/manage
create policy "Own credentials select" on public.credentials
  for select using (auth.uid() = user_id);

create policy "Own credentials insert" on public.credentials
  for insert with check (auth.uid() = user_id);

create policy "Own credentials update" on public.credentials
  for update using (auth.uid() = user_id);

-- Intents: owner can manage, all can read active
create policy "Active intents visible to all" on public.intents
  for select using (status = 'active');

create policy "Users can insert own intents" on public.intents
  for insert with check (auth.uid() = user_id);

create policy "Users can update own intents" on public.intents
  for update using (auth.uid() = user_id);

create policy "Users can delete own intents" on public.intents
  for delete using (auth.uid() = user_id);

-- Matches: participants can see
create policy "Match participants can view" on public.matches
  for select using (
    auth.uid() = initiator_user_id or auth.uid() = responder_user_id
  );

-- Proposals: participants can see and manage
create policy "Proposal participants can view" on public.proposals
  for select using (
    auth.uid() = initiator_user_id or auth.uid() = responder_user_id
  );

create policy "Proposal participants can update" on public.proposals
  for update using (
    auth.uid() = initiator_user_id or auth.uid() = responder_user_id
  );

-- Messages: participants can see and send
create policy "Message participants can view" on public.messages
  for select using (
    auth.uid() = sender_user_id or
    auth.uid() in (
      select initiator_user_id from public.proposals where id = proposal_id
      union
      select responder_user_id from public.proposals where id = proposal_id
    )
  );

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = sender_user_id);

-- Indexes for performance
create index if not exists idx_profiles_did on public.profiles(did);
create index if not exists idx_profiles_trust_score on public.profiles(trust_score desc);
create index if not exists idx_credentials_user_id on public.credentials(user_id);
create index if not exists idx_intents_user_id on public.intents(user_id);
create index if not exists idx_intents_status on public.intents(status);
create index if not exists idx_matches_initiator on public.matches(initiator_user_id);
create index if not exists idx_matches_responder on public.matches(responder_user_id);
create index if not exists idx_proposals_match on public.proposals(match_id);
create index if not exists idx_messages_proposal on public.messages(proposal_id);
