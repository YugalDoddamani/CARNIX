export async function onRequest(context) {
  const response = await context.next();
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;

  const env = context.env || {};
  const url = env.SUPABASE_URL || '';
  const key = env.SUPABASE_PUBLISHABLE_KEY || '';

  if (!url || !key) return response;

  const html = await response.text();
  const injection =
    `<script>window.__ENV__={SUPABASE_URL:${JSON.stringify(url)},SUPABASE_PUBLISHABLE_KEY:${JSON.stringify(key)}};</script>`;

  return new Response(html.replace(/<head>/i, `<head>${injection}`), {
    status: response.status,
    headers: response.headers,
  });
}