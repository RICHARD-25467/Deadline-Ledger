-- Deadline Ledger database
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  course text not null default '',
  category text not null default 'Assignment'
    check (category in ('Assignment','Exam','Project','Reading','Other')),
  due_date date not null,
  due_time time null,
  priority text not null default 'medium'
    check (priority in ('low','medium','high')),
  reminder_days integer not null default 1
    check (reminder_days between 0 and 30),
  notes text not null default '',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deadlines_user_due_idx
  on public.deadlines(user_id, due_date);

create index if not exists deadlines_user_completed_idx
  on public.deadlines(user_id, completed);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deadlines_set_updated_at on public.deadlines;

create trigger deadlines_set_updated_at
before update on public.deadlines
for each row
execute function public.set_updated_at();

alter table public.deadlines enable row level security;

drop policy if exists "Users can view their own deadlines" on public.deadlines;
create policy "Users can view their own deadlines"
on public.deadlines for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own deadlines" on public.deadlines;
create policy "Users can create their own deadlines"
on public.deadlines for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own deadlines" on public.deadlines;
create policy "Users can update their own deadlines"
on public.deadlines for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own deadlines" on public.deadlines;
create policy "Users can delete their own deadlines"
on public.deadlines for delete
to authenticated
using (auth.uid() = user_id);
