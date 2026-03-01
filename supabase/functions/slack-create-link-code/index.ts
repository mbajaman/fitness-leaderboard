import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Validate requests using the anon key (same as REACT_APP_SUPABASE_ANON_KEY). Set in Edge Function secrets if not auto-injected.
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

function randomCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  for (let i = 0; i < length; i++) out += chars[buf[i]! % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const auth = req.headers.get('Authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!SUPABASE_ANON_KEY || bearer !== SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: { user_id?: string; disconnect?: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const userId = typeof body?.user_id === 'string' ? body.user_id.trim() : '';
  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (body.disconnect) {
    const { error } = await supabase.from('slack_user_links').delete().eq('user_id', userId);
    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to disconnect' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const code = randomCode(6);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error } = await supabase.from('slack_link_codes').insert({ code, user_id: userId, expires_at: expiresAt });
  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to create code' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(
    JSON.stringify({ code, expires_in_minutes: 15 }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
});
