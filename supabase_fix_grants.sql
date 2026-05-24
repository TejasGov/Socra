-- ONLY run this AFTER supabase_schema.sql has been run successfully.
-- If you see "relation public.chat_messages does not exist", run supabase_schema.sql first.
--
-- Use when chat/comments return "permission denied for table ..." but tables already exist.
-- Safe to re-run.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.chat_messages to anon, authenticated;
grant select, insert, update, delete on public.day_comments to anon, authenticated;
grant select, insert, update, delete on public.phase_statuses to anon, authenticated;
grant select, insert, update, delete on public.chat_perms to anon, authenticated;
