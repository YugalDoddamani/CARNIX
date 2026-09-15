// Loads Supabase client from CDN as ESM.
// Replace with npm package when we move to Vite.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL =
  window.__ENV__?.SUPABASE_URL ||
  'https://istkdonjcfzrzpsqxmqb.supabase.co';

const SUPABASE_KEY =
  window.__ENV__?.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_rInWh7DXWIF7pXtJFkOkBw_y-dBmu9k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
