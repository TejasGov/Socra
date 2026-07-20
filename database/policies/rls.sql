-- Row Level Security policies for Socra.
-- Apply after migrations. Tighten these before any pilot with real users.
-- NOTE: never store real student data in development.

alter table courses           enable row level security;
alter table course_materials  enable row level security;
alter table material_chunks   enable row level security;

-- Placeholder policies. Replace with the real ownership/enrollment model.
-- Example: allow authenticated users to read courses.
create policy "authenticated can read courses"
    on courses for select
    to authenticated
    using (true);

-- Course materials and chunks are retrieved server-side using the
-- service-role key, which bypasses RLS. Client-side access should remain
-- denied by default (no permissive policy) until an enrollment model exists.
