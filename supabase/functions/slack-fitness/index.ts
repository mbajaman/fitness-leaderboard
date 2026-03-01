import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SLACK_SIGNING_SECRET = Deno.env.get('SLACK_SIGNING_SECRET')!;

function slackJson(text: string, ephemeral = true): Response {
  return new Response(JSON.stringify({ response_type: ephemeral ? 'ephemeral' : 'in_channel', text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifySlackRequest(body: string, signature: string | null, timestamp: string | null): Promise<boolean> {
  if (!SLACK_SIGNING_SECRET || !signature || !timestamp) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 60 * 5) return false; // reject if older than 5 minutes
  const base = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SLACK_SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(base));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `v0=${hex}` === signature;
}

function parseFormBody(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of body.split('&')) {
    const [k, v] = pair.split('=').map((s) => decodeURIComponent(s.replace(/\+/g, ' ')));
    if (k && v !== undefined) out[k] = v;
  }
  return out;
}

function getMarchBounds(): { start: string; end: string } {
  const y = new Date().getFullYear();
  return { start: `${y}-03-01`, end: `${y}-03-31` };
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const rawBody = await req.text();
  const sig = req.headers.get('X-Slack-Signature');
  const ts = req.headers.get('X-Slack-Request-Timestamp');
  if (!(await verifySlackRequest(rawBody, sig, ts))) {
    const hint = !SLACK_SIGNING_SECRET
      ? 'SLACK_SIGNING_SECRET is not set in Supabase Edge Function secrets.'
      : !sig || !ts
        ? 'Slack signature headers missing (request may not be from Slack).'
        : 'Signature mismatch. In Supabase set SLACK_SIGNING_SECRET to the exact Signing Secret from Slack (Basic Information → App Credentials), then redeploy.';
    return slackJson(`Verification failed. ${hint}`);
  }

  const form = parseFormBody(rawBody);
  const command = (form.command || '').trim();
  const text = (form.text || '').trim();
  const slackUserId = (form.user_id || '').trim();
  const responseUrl = form.response_url;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const getLeaderboardUser = async (): Promise<{ id: string; username: string } | null> => {
    const { data: link, error: linkErr } = await supabase.from('slack_user_links').select('user_id').eq('slack_user_id', slackUserId).maybeSingle();
    if (linkErr || !link?.user_id) return null;
    const { data: u, error } = await supabase.from('users').select('id, username').eq('id', link.user_id).maybeSingle();
    if (error || !u) return null;
    return u;
  };

  if (command === '/link') {
    const code = text.replace(/\s+/g, ' ').trim().toUpperCase();
    if (!code) return slackJson('Usage: /link <CODE>\nGet your code from the leaderboard site (Connect Slack).');
    const { data: linkRow, error: linkErr } = await supabase.from('slack_link_codes').select('user_id').eq('code', code).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (linkErr || !linkRow) return slackJson('Invalid or expired code. Get a new code from the leaderboard site.');
    const { error: upsertErr } = await supabase.from('slack_user_links').upsert(
      { slack_user_id: slackUserId, user_id: linkRow.user_id },
      { onConflict: 'slack_user_id' }
    );
    if (upsertErr) return slackJson('Something went wrong. Try again or use the web app.');
    await supabase.from('slack_link_codes').delete().eq('code', code);
    return slackJson('Your Slack account is now linked to the leaderboard. You can use /log, /score, and /leaderboard.');
  }

  if (command === '/score') {
    const user = await getLeaderboardUser();
    if (!user) return slackJson('Your Slack account is not linked. Go to the leaderboard site and use "Connect Slack", then run /link <code>.');
    const { data: scoreRow } = await supabase.from('user_scores').select('total_score').eq('user_id', user.id).single();
    const { data: entries } = await supabase.from('daily_star_entries').select('quantity, star_types(name)').eq('user_id', user.id);
    const total = scoreRow?.total_score ?? 0;
    const byType: Record<string, number> = { yellow: 0, blue: 0, red: 0 };
    (entries || []).forEach((r: { quantity: number; star_types: { name: string } | null }) => {
      const name = r.star_types?.name;
      if (name && byType[name] !== undefined) byType[name] += Number(r.quantity) || 0;
    });
    const msg = `*${user.username}* — Score: *${total}* pts\nActivity: ${byType.yellow} | Daily challenge: ${byType.blue} | Bonus: ${byType.red}`;
    return slackJson(msg);
  }

  if (command === '/log') {
    const user = await getLeaderboardUser();
    if (!user) return slackJson('Your Slack account is not linked. Go to the leaderboard site and use "Connect Slack", then run /link <code>.');
    const parts = text ? text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean) : [];
    let dateStr = toDateStr(new Date());
    let typeArg = '';
    let countArg = '';
    let i = 0;
    if (parts.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
      dateStr = parts[0];
      i = 1;
    }
    if (i < parts.length) {
      const a = parts[i];
      const b = parts[i + 1];
      const isType = (s: string) => /^(activity|daily|bonus)$/i.test(s) || /^yellow|blue|red$/i.test(s);
      const isNum = (s: string) => /^\d+$/.test(s);
      if (isType(a) && isNum(b)) {
        typeArg = a;
        countArg = b;
      } else if (isNum(a) && isType(b)) {
        countArg = a;
        typeArg = b;
      } else if (isType(a)) {
        typeArg = a;
        countArg = '';
      } else {
        typeArg = a;
        countArg = b || '';
      }
    }
    const { start: marchStart, end: marchEnd } = getMarchBounds();
    if (dateStr < marchStart || dateStr > marchEnd) return slackJson(`Only March dates are allowed (${marchStart} to ${marchEnd}).`);
    const typeMap: Record<string, string> = { activity: 'yellow', activities: 'yellow', daily: 'blue', bonus: 'red', yellow: 'yellow', blue: 'blue', red: 'red' };
    const starName = typeMap[typeArg.toLowerCase()] || typeMap[typeArg.toLowerCase().replace(/s$/, '')];
    if (!starName) return slackJson('Usage: /log [YYYY-MM-DD] activity|daily|bonus [1-6 for activity]\nExample: /log 3 activity');
    const { data: starTypes } = await supabase.from('star_types').select('id, name, max_per_day').in('name', ['yellow', 'blue', 'red']);
    const star = (starTypes || []).find((s: { name: string }) => s.name === starName);
    if (!star) return slackJson('Star type not found.');
    let quantity = star.name === 'yellow' ? Math.min(6, Math.max(0, parseInt(countArg, 10) || 1)) : 1;
    if (quantity <= 0 && star.name === 'yellow') quantity = 1;
    const { error: upsertErr } = await supabase.from('daily_star_entries').upsert(
      { user_id: user.id, date: dateStr, star_type_id: star.id, checked: quantity > 0, quantity },
      { onConflict: 'user_id,date,star_type_id' }
    );
    if (upsertErr) return slackJson('Something went wrong. Try again or use the web app.');
    const label = star.name === 'yellow' ? 'activity' : star.name === 'blue' ? 'daily challenge' : 'bonus challenge';
    return slackJson(`Logged ${quantity} ${label} star(s) for ${dateStr}.`);
  }

  if (command === '/leaderboard') {
    const limit = Math.min(20, Math.max(1, parseInt(text.trim(), 10) || 10));
    const { data: rows } = await supabase.from('user_scores').select('user_id, total_score').order('total_score', { ascending: false }).limit(limit);
    if (!rows || rows.length === 0) return slackJson('No leaderboard data yet.');
    const userIds = rows.map((r: { user_id: string }) => r.user_id);
    const { data: users } = await supabase.from('users').select('id, username').in('id', userIds);
    const nameMap = (users || []).reduce((acc: Record<string, string>, u: { id: string; username: string }) => {
      acc[u.id] = u.username;
      return acc;
    }, {});
    const lines = rows.map((r: { user_id: string; total_score: number }, i: number) => `${i + 1}. ${nameMap[r.user_id] || 'Unknown'} — ${r.total_score} pts`);
    return slackJson('*Leaderboard*\n' + lines.join('\n'));
  }

  return slackJson(`Unknown command: ${command}. Use /link, /log, /score, or /leaderboard.`);
});
