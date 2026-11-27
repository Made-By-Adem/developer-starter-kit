import { createRemoteJWKSet, jwtVerify } from 'jose';

// Protects the admin area with Cloudflare Access.
//
// Cloudflare Access shows a login screen before anyone reaches /admin and then adds a signed
// token to every request. This file checks that token, so the admin area stays closed even
// if Access is switched off or misconfigured by accident.
//
// Returns null when the visitor may continue, or a Response that refuses the request.

let keys;

const refuse = (error, status) => Response.json({ success: false, error }, { status });

const isLocalhost = (request) => {
  const { hostname } = new URL(request.url);
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

export async function requireAccess(request, env) {
  // Local development only. Ignored on any real address, so it cannot open production.
  if (env.ACCESS_DEV_BYPASS === 'true' && isLocalhost(request)) {
    return null;
  }

  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const audience = env.ACCESS_AUD;
  if (!teamDomain || !audience) {
    // Not set up yet: stay closed.
    return refuse('The admin area is not set up yet', 503);
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) {
    return refuse('Not allowed', 403);
  }

  try {
    keys ??= createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    await jwtVerify(token, keys, { issuer: teamDomain, audience });
    return null;
  } catch {
    return refuse('Not allowed', 403);
  }
}
