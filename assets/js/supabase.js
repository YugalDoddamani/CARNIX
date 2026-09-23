import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Env injected at runtime by functions/_middleware.js from Cloudflare Pages
// environment variables. No fallback — fail loudly if it's missing.
const SUPABASE_URL = window.__ENV__?.SUPABASE_URL;
const SUPABASE_KEY = window.__ENV__?.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase env. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Cloudflare Pages env vars.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});