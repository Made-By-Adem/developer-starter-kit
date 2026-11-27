import { requireAccess } from './access.js';

// Every answer has the same shape, so the frontend always knows what to expect.
const ok = (data, status = 200) => Response.json({ success: true, data }, { status });
const fail = (error, status) => Response.json({ success: false, error }, { status });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readJson = async (request) => {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
};

const text = (value, max) => (typeof value === 'string' && value.trim().length <= max ? value.trim() : null);

// ---------- Public API: anyone can call these ----------

async function publicApi(request, env, url) {
  const { pathname } = url;

  if (request.method === 'GET' && pathname === '/api/health') {
    return ok({ status: 'ok' });
  }

  const page = pathname.match(/^\/api\/pages\/([a-z0-9-]{1,64})$/);
  if (request.method === 'GET' && page) {
    const row = await env.DB.prepare('SELECT slug, title, body, updated_at FROM pages WHERE slug = ?')
      .bind(page[1])
      .first();
    return row ? ok(row) : fail('Page not found', 404);
  }

  if (request.method === 'POST' && pathname === '/api/contact') {
    const visitor = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.CONTACT_LIMITER) {
      const { success } = await env.CONTACT_LIMITER.limit({ key: visitor });
      if (!success) return fail('Too many messages, please try again in a minute', 429);
    }

    const body = await readJson(request);
    if (!body) return fail('Send the form as JSON', 400);

    // Hidden field that people leave empty and spam bots fill in. Pretend it worked.
    if (body.website) return ok({ received: true }, 201);

    const name = text(body.name, 100);
    const email = text(body.email, 200);
    const message = text(body.message, 5000);
    if (!name || !email || !message || !EMAIL_PATTERN.test(email)) {
      return fail('Fill in your name, a valid email address and a message', 400);
    }

    await env.DB.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)')
      .bind(name, email, message)
      .run();
    return ok({ received: true }, 201);
  }

  return fail('Not found', 404);
}

// ---------- Admin API: only after the Cloudflare Access check ----------

async function adminApi(request, env, url) {
  const { pathname } = url;

  // Changes must come from our own admin page, not from another website.
  if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) {
    return fail('Not allowed', 403);
  }

  if (request.method === 'GET' && pathname === '/admin/api/messages') {
    const { results } = await env.DB.prepare(
      'SELECT id, name, email, message, created_at FROM messages ORDER BY created_at DESC LIMIT 100',
    ).all();
    return ok(results);
  }

  const message = pathname.match(/^\/admin\/api\/messages\/(\d{1,12})$/);
  if (request.method === 'DELETE' && message) {
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(Number(message[1])).run();
    return ok({ deleted: true });
  }

  const page = pathname.match(/^\/admin\/api\/pages\/([a-z0-9-]{1,64})$/);
  if (request.method === 'PUT' && page) {
    const body = await readJson(request);
    const title = body && text(body.title, 200);
    const content = body && text(body.body, 20000);
    if (!title || !content) return fail('Fill in a title and a text', 400);

    await env.DB.prepare(
      `INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)
       ON CONFLICT (slug) DO UPDATE SET title = excluded.title, body = excluded.body, updated_at = datetime('now')`,
    )
      .bind(page[1], title, content)
      .run();
    return ok({ saved: true });
  }

  return fail('Not found', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
        const refused = await requireAccess(request, env);
        if (refused) return refused;

        if (url.pathname.startsWith('/admin/api/')) return await adminApi(request, env, url);
        return env.ASSETS.fetch(request);
      }

      if (url.pathname.startsWith('/api/')) return await publicApi(request, env, url);

      return env.ASSETS.fetch(request);
    } catch (error) {
      // Log the error, never the request body: it can hold personal data.
      console.error(error);
      return fail('Something went wrong', 500);
    }
  },
};
