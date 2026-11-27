#!/usr/bin/env node
// Global PreToolUse hook for Bash. Enforces the migration and push rules:
//   - applying migrations to a LOCAL database is allowed (normal permission flow);
//   - resetting a local database, repairing migration history, or anything that
//     targets a remote/linked database (production or unknown) needs the user's
//     explicit OK: the hook answers "ask", so a permission prompt shows the reason;
//   - force-push stays blocked.
//
// Patterns are anchored to command position (start of input or right after a
// command separator), so merely mentioning these commands in a commit message,
// echo or grep pattern does not trigger anything.

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    cmd = JSON.parse(input).tool_input?.command || '';
  } catch {
    process.exit(0); // unparsable input: never block on hook failure
  }

  const SEP = '(?:^|[;&|(`]\\s*|\\n\\s*)';
  const LOOPBACK = /(?:localhost|127\.0\.0\.1|\[?::1\]?|host\.docker\.internal)/i;

  const block = (msg) => {
    console.error(`BLOCKED by block-migration-apply.cjs: ${msg}`);
    process.exit(2);
  };
  const ask = (reason) => {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  };

  // Force-push: always blocked.
  if (
    new RegExp(
      SEP + String.raw`git\s+push\b[^;&|\n]*(?:\s--force(?:-with-lease)?\b|\s-f\b)`,
      'i'
    ).test(cmd)
  ) {
    block('Force-push is blocked. Ask the user first; if intended they run it themselves with the ! prefix.');
  }

  // Supabase CLI: db push / db reset / migration up|repair|apply
  const supa = new RegExp(
    SEP +
      String.raw`(?:\S*[\\/])?(?:npx\s+(?:-y\s+)?)?supabase(?:@[\w.-]+)?(?:\.exe)?\s+(db\s+(?:push|reset)|migration\s+(?:up|repair|apply))([^;&|\n]*)`,
    'i'
  );
  const m = cmd.match(supa);
  if (m) {
    const action = m[1].replace(/\s+/g, ' ').toLowerCase();
    const args = m[2] || '';
    const dbUrl = args.match(/--db-url[=\s]+(\S+)/i)?.[1];
    const localUrl = dbUrl && LOOPBACK.test(dbUrl);
    const remote =
      /--linked\b|--project-ref\b/i.test(args) ||
      (dbUrl && !localUrl) ||
      (action === 'db push' && !/--local\b/i.test(args) && !localUrl);

    if (remote) {
      ask(
        `REMOTE DATABASE (production or unknown): \`supabase ${action}\` targets a linked/remote database. Approve only if you explicitly want it applied there.`
      );
    }
    if (action === 'db reset') {
      ask('LOCAL database reset: wipes all local data and reloads migrations + seed.');
    }
    if (action === 'migration repair') {
      ask('migration repair rewrites the migration history table. Approve only if intended.');
    }
    process.exit(0); // local migration up / apply / push --local: allowed
  }

  // psql -f <…migrations…>: local host allowed, anything else needs the user's OK
  const p = cmd.match(new RegExp(SEP + String.raw`psql\b[^;&|\n]*\s-f\s+[^;&|\n]*migrations[^;&|\n]*`, 'i'));
  if (p) {
    const seg = p[0];
    const target =
      seg.match(/(?:\s-h|--host)[=\s]+(\S+)/i)?.[1] || seg.match(/postgres(?:ql)?:\/\/\S+/i)?.[0];
    const viaDocker = /docker\s+exec\b/i.test(cmd);
    if (!viaDocker && target && !LOOPBACK.test(target)) {
      ask('REMOTE DATABASE (production or unknown): applying a migration file via psql to a non-local host.');
    }
    process.exit(0);
  }

  process.exit(0);
});
