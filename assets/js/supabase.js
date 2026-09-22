import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Prefer injected env from Cloudflare middleware.
// Fallback keeps the app working if injection fails — remove after diagnosing.
const SUPABASE_URL =
  window.__ENV__?.SUPABASE_URL ||
  'https://istkdonjcfzrzpsqxmqb.supabase.co';

const SUPABASE_KEY =
  window.__ENV__?.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_rInWh7DXWIF7pXtJFkOkBw_y-dBmu9k';

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY === 'PASTE_YOUR_PUBLISHABLE_KEY_HERE') {
  throw new Error('Missing Supabase env.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});