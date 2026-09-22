import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Prefer injected env (Cloudflare middleware). Fallback is for local dev only —
// remove the fallback after confirming Cloudflare injection works, then rotate the key.
const SUPABASE_URL =
  window.__ENV__?.SUPABASE_URL ||
  'https://istkdonjcfzrzpsqxmqb.supabase.co';

const SUPABASE_KEY =
  window.__ENV__?.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_rInWh7DXWIF7pXtJFkOkBw_y-dBmu9k';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase env. Set SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY in Cloudflare Pages env vars.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});