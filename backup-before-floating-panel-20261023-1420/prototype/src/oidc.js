// "Sign in with PointMint": PROTOTYPE stubs only. A discovery document and a demo consent page that show how
// Match Point (and other apps) would use PointMint as the identity layer. Nothing here issues codes or tokens.
const SCOPES = {
  openid: 'Confirm it’s you (verified human, one per phone number)',
  profile: 'Your name, headline, company and profile photo',
  'vault:read': 'Read your intent vault (buy, sell, seek, acquire)',
  'vault:write': 'Add or update vault cards (labeled with the app that wrote them)',
  'agent:act': 'Let your one PointMint AI agent work inside the app. You still approve every intro and post',
  meetings: 'Prep, schedule and follow up on meetings, and log outcomes to your intro tracker',
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KNOWN_CLIENTS = { 'matchpoint-demo': 'Match Point (demo client)' };

export function discovery(origin) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    userinfo_endpoint: `${origin}/oauth/userinfo`,
    jwks_uri: `${origin}/oauth/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'private_key_jwt'],
    subject_types_supported: ['pairwise'],
    id_token_signing_alg_values_supported: ['ES256'],
    scopes_supported: Object.keys(SCOPES),
    claims_supported: ['sub', 'name', 'picture', 'pointmint_level', 'pointmint_agent_id'],
    'x-pointmint-prototype': 'PROTOTYPE: discovery only. The authorize page is a demo; no codes, tokens or keys are issued.',
  };
}

export function oidcRoute(request, url) {
  const p = url.pathname, origin = url.origin;
  const j = (o, status = 200) => new Response(JSON.stringify(o, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' } });
  if (p === '/.well-known/openid-configuration' || p === '/.well-known/oauth-authorization-server') return j(discovery(origin));
  if (p === '/oauth/jwks.json') return j({ keys: [], note: 'PROTOTYPE: no signing keys are published yet.' });
  if (p === '/oauth/token' || p === '/oauth/userinfo') return j({ error: 'temporarily_unavailable', error_description: 'PROTOTYPE: Sign in with PointMint is designed but not live. No tokens are issued.' }, 501);
  if (p !== '/oauth/authorize') return null;
  const q = url.searchParams;
  const client = q.get('client_id') || 'matchpoint-demo';
  const app = KNOWN_CLIENTS[client] || 'Unknown app';
  const asked = (q.get('scope') || 'openid profile vault:read agent:act meetings').split(/\s+/).filter(s => SCOPES[s]);
  const problems = [];
  if (q.get('response_type') && q.get('response_type') !== 'code') problems.push('response_type must be "code"');
  if (q.get('code_challenge_method') && q.get('code_challenge_method') !== 'S256') problems.push('PKCE requires code_challenge_method=S256');
  if (q.has('response_type') && !q.get('code_challenge')) problems.push('PKCE code_challenge is required');
  if (!KNOWN_CLIENTS[client]) problems.push('unknown client_id');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Sign in with PointMint (prototype)</title><link rel="stylesheet" href="/styles.css?v=9"><link rel="stylesheet" href="/identity.css?v=9"><link rel="stylesheet" href="/oauth.css?v=9"></head>
<body class="oauth"><main class="oa">
<p class="oa-proto" role="note"><b>Prototype</b> · This consent screen is a design demo. Nothing is issued or shared, and no code is sent back.</p>
<div class="oa-card">
<p class="oa-brand"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" class="bm-bg"/><path d="M16 7.5 24.5 16 16 24.5 7.5 16Z" class="bm-fg"/></svg>Sign in with PointMint</p>
<h1><b>${esc(app)}</b> wants to use your PointMint account</h1>
<p class="oa-sub">One account and one AI agent across PointMint apps. Your vault stays in one place, and you choose what each app can see.</p>
<ul class="oa-scopes">${asked.map(s => `<li><code>${esc(s)}</code><span>${esc(SCOPES[s])}</span></li>`).join('')}</ul>
${problems.length ? `<p class="oa-warn" role="alert">This request would be rejected: ${esc(problems.join('; '))}.</p>` : ''}
<p class="oa-rules">Your agent keeps the same rules everywhere: it always says it’s an AI, it proposes and you approve, and nobody gets your contact details until both people say yes. You can revoke access at any time from your PointMint dashboard.</p>
<div class="oa-actions"><a class="btn secondary" href="/">Cancel</a><a class="btn" href="/about" aria-describedby="oaNote">Allow (demo)</a></div>
<p class="oa-note" id="oaNote">Demo: “Allow” goes to “How it works”. In the real flow it would redirect to the app with a one-time code (OAuth 2.1 + PKCE, OIDC).</p>
</div></main></body></html>`;
  return new Response(request.method === 'HEAD' ? null : html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}
