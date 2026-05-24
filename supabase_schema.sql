-- 1. Create tables
CREATE TABLE public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  channel text not null,
  uid text not null,
  text text not null,
  time text,
  date text,
  pinned_date text,
  pinned_date_label text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.day_comments (
  id uuid default gen_random_uuid() primary key,
  date_key text not null,
  uid text not null,
  text text not null,
  time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.phase_statuses (
  phase_index integer primary key,
  status text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.chat_perms (
  uid text primary key,
  can_post boolean default true
);

-- 2. Turn on Realtime for all tables
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.day_comments;
alter publication supabase_realtime add table public.phase_statuses;
alter publication supabase_realtime add table public.chat_perms;

-- 3. Set up Row Level Security (RLS)
-- Since auth is handled via mock client-side logic, we open RLS for anon read/write.
alter table public.chat_messages enable row level security;
alter table public.day_comments enable row level security;
alter table public.phase_statuses enable row level security;
alter table public.chat_perms enable row level security;

create policy "Allow all access to chat_messages" on public.chat_messages for all using (true) with check (true);
create policy "Allow all access to day_comments" on public.day_comments for all using (true) with check (true);
create policy "Allow all access to phase_statuses" on public.phase_statuses for all using (true) with check (true);
create policy "Allow all access to chat_perms" on public.chat_perms for all using (true) with check (true);

-- 4. Table privileges (required — RLS alone is not enough)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.chat_messages to anon, authenticated;
grant select, insert, update, delete on public.day_comments to anon, authenticated;
grant select, insert, update, delete on public.phase_statuses to anon, authenticated;
grant select, insert, update, delete on public.chat_perms to anon, authenticated;

-- 5. Insert initial permissions
insert into public.chat_perms (uid, can_post) values ('tejas', true), ('atshal', true)
on conflict (uid) do nothing;
