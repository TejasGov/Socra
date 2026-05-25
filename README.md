# Research Project Website

A static multi-page research project site with calendar, Gantt timeline, team chat, and date-pinned comments. Data is stored in Supabase with realtime updates — no build step required.

## Setup

1. Open `config.js` and set your Supabase credentials from **Dashboard → Settings → API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
2. In Supabase **SQL Editor**, run the **entire** `supabase_schema.sql` first (creates tables + grants). Do **not** run `supabase_fix_grants.sql` on a new empty project.
   - `supabase_fix_grants.sql` is only if tables already exist and you still get **permission denied**.
3. Open `login.html` in a browser (or serve the folder with any static host).

## Login (mock credentials)

| User ID | Password | Role   |
|---------|----------|--------|
| PD01    | 0202     | owner  |
| TG05    | 1515     | tejas  |
| AK03    | 0909     | atshal |

## Pages

| File | Description |
|------|-------------|
| `login.html` | Sign in (client-side credentials) |
| `index.html` | Overview, phase status, team |
| `calendar.html` | Calendar with phases, advising sessions, day comments |
| `gantt.html` | Gantt timeline and progress |
| `chat.html` | Team chat (3 channels), date pins, posting permissions |

## File structure

```
├── login.html
├── index.html
├── calendar.html
├── gantt.html
├── chat.html
├── css/
│   └── style.css
├── js/
│   └── data.js
├── config.js
└── README.md
```

## Script load order (every app page)

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="js/data.js"></script>
```

## Features

- **Chat**: Messages saved to `chat_messages`; realtime INSERT updates the UI per channel.
- **Calendar**: Day comments in `day_comments` with realtime on the selected day.
- **Phases**: Status in `phase_statuses` with realtime on overview and Gantt.
- **Permissions**: Owner can toggle posting for collaborators via `chat_perms`.
- **Security**: Content-Security-Policy on all pages; user text via `textContent` only; rate limits on sends/comments.

## Deploying on Vercel

### Option A — GitHub (recommended)

1. Push your branch to GitHub (`TejasGov/tasks-Socra`).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **Production branch:** `Reconfuring_Session_Chat` (or `main` after merge).
4. **Framework Preset:** Other  
   **Build Command:** `npm run build`  
   **Output Directory:** `.` (project root)
5. **Environment Variables** (Settings → Environment Variables):

   | Name | Value |
   |------|--------|
   | `SUPABASE_URL` | `https://ticwwnssngfeyztpvmoo.supabase.co` |
   | `SUPABASE_ANON_KEY` | Your publishable key from Supabase API Keys |

6. **Deploy**. The build runs `scripts/generate-config.js` and creates `config.js` on the server (not committed to git).

### Option B — Vercel CLI

```bash
npm i -g vercel
cd tasks-Socra
vercel
# follow prompts; add env vars in the dashboard or:
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel --prod
```

### After deploy

- Site URL will look like `https://tasks-socra.vercel.app`
- Open `/login.html` to sign in
- Ensure Supabase **SQL schema** (`supabase_schema.sql`) was run on the same project as your env vars

## Customization

- Phases, meetings, users: edit `js/data.js`
- Styles: `css/style.css`
- Copy: edit HTML pages directly
