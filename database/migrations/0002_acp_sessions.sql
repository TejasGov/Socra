-- Socra ACP (Agent Client Protocol) bring-your-own-subscription migration.
-- Adds tables to ingest chat transcripts from student-run Claude Code / Codex
-- ACP sessions, gated on explicit data-collection consent. See
-- docs/acp-integration.md for the full design.

-- ACP sessions -----------------------------------------------------------
create table if not exists acp_sessions (
    id                        uuid primary key default gen_random_uuid(),
    user_id                   uuid not null references auth.users (id) on delete cascade,
    provider                  text not null check (provider in ('claude', 'codex')),
    course_id                 uuid references courses (id) on delete set null,
    data_collection_consent   boolean not null default false,
    created_at                timestamptz not null default now()
);

-- ACP messages -------------------------------------------------------------
-- Individual turns of a transcript (prompts + responses) for a session.
create table if not exists acp_messages (
    id          uuid primary key default gen_random_uuid(),
    session_id  uuid not null references acp_sessions (id) on delete cascade,
    role        text not null check (role in ('user', 'assistant', 'system')),
    content     text not null,
    created_at  timestamptz not null default now()
);

-- Index supporting ordered transcript retrieval per session.
create index if not exists acp_messages_session_created_idx
    on acp_messages (session_id, created_at);

-- Row Level Security -------------------------------------------------------
alter table acp_sessions enable row level security;
alter table acp_messages enable row level security;

-- Students may create their own ACP sessions.
create policy "students insert own acp sessions"
    on acp_sessions for insert
    to authenticated
    with check (user_id = auth.uid());

-- Students may read only their own ACP sessions.
create policy "students select own acp sessions"
    on acp_sessions for select
    to authenticated
    using (user_id = auth.uid());

-- Service role (backend) has unrestricted access for ingestion/administration.
create policy "service role full access to acp sessions"
    on acp_sessions for all
    to service_role
    using (true)
    with check (true);

-- Students may append messages only to sessions they own.
create policy "students insert own acp messages"
    on acp_messages for insert
    to authenticated
    with check (
        exists (
            select 1 from acp_sessions s
            where s.id = acp_messages.session_id
              and s.user_id = auth.uid()
        )
    );

-- Students may read only messages belonging to their own sessions.
create policy "students select own acp messages"
    on acp_messages for select
    to authenticated
    using (
        exists (
            select 1 from acp_sessions s
            where s.id = acp_messages.session_id
              and s.user_id = auth.uid()
        )
    );

-- Service role (backend) has unrestricted access for ingestion/administration.
create policy "service role full access to acp messages"
    on acp_messages for all
    to service_role
    using (true)
    with check (true);
