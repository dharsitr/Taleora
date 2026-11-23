-- ============================================================
-- Phase 22: Enterprise Security Audit Logging & Idempotency Store
-- Provides tamper-evident immutable audit trails and replay-proof API execution.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create audit_logs table
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- Performance & investigation indexes
create index if not exists idx_audit_logs_action_created on public.audit_logs (action, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index if not exists idx_audit_logs_target on public.audit_logs (target_type, target_id);

-- Enable Row Level Security
alter table public.audit_logs enable row level security;

-- Explicit table grant for Data (REST) API access under RLS
grant select, insert on table public.audit_logs to authenticated;

-- Audit logs are insertable by authenticated users and service roles
create policy "Authenticated users can insert audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (true);

-- Audit logs are viewable strictly by admins and moderators
create policy "Admins and moderators can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role in ('admin', 'moderator')
        and is_suspended = false
    )
  );

-- No UPDATE or DELETE policies are granted: audit_logs is append-only/immutable.

-- ------------------------------------------------------------
-- 2. Create idempotency_keys table
-- ------------------------------------------------------------
create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  response_status integer not null,
  response_body text not null,
  response_headers jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '24 hours') not null
);

create index if not exists idx_idempotency_keys_key on public.idempotency_keys (key);
create index if not exists idx_idempotency_keys_user_id on public.idempotency_keys (user_id);
create index if not exists idx_idempotency_keys_expires on public.idempotency_keys (expires_at);

alter table public.idempotency_keys enable row level security;

-- Explicit table grant for Data (REST) API access under RLS
grant all on table public.idempotency_keys to authenticated;

-- Users can query their own idempotency keys
create policy "Users can manage their own idempotency keys"
  on public.idempotency_keys
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
