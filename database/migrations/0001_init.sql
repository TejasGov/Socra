-- Socra initial migration
-- Enables pgvector and creates baseline tables for course materials
-- and their embeddings. Run against the Supabase Postgres database.

create extension if not exists vector;

-- Courses --------------------------------------------------------------
create table if not exists courses (
    id          uuid primary key default gen_random_uuid(),
    title       text not null,
    description text,
    created_at  timestamptz not null default now()
);

-- Course materials (uploaded PDFs, etc.) -------------------------------
create table if not exists course_materials (
    id          uuid primary key default gen_random_uuid(),
    course_id   uuid not null references courses (id) on delete cascade,
    filename    text not null,
    storage_path text not null,
    created_at  timestamptz not null default now()
);

-- Embedded chunks ------------------------------------------------------
-- Dimension must match EMBEDDING_DIM (default 384 for bge-small-en-v1.5).
create table if not exists material_chunks (
    id          uuid primary key default gen_random_uuid(),
    material_id uuid not null references course_materials (id) on delete cascade,
    chunk_index int  not null,
    content     text not null,
    embedding   vector(384),
    created_at  timestamptz not null default now()
);

-- Approximate nearest-neighbour index for retrieval.
create index if not exists material_chunks_embedding_idx
    on material_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);
