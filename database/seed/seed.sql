-- Development seed data for Socra.
-- ⚠️ SYNTHETIC DATA ONLY. Never put real student data here.

insert into courses (id, title, description)
values
    ('00000000-0000-0000-0000-000000000001',
     'Intro to Calculus (sample)',
     'Synthetic course for local development.')
on conflict (id) do nothing;
