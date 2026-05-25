/* Generates config.js from Vercel/local env vars at build time */
const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_KEY). Set them in Vercel → Settings → Environment Variables.'
  );
  process.exit(1);
}

const content = `/* config.js — auto-generated at build; do not commit */
const SUPABASE_URL = ${JSON.stringify(url)};
const SUPABASE_ANON_KEY = ${JSON.stringify(key)};
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
`;

fs.writeFileSync('config.js', content);
console.log('Wrote config.js');
