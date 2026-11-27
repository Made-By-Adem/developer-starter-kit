---
description: Stop the local dev stack of the current repo — what /stack-up started, and on request the rest of the project's local infra — then verify it is really down. Never touches remote systems or deletes data.
argument-hint: "[app name(s) to stop | 'all' to include infra not started by /stack-up]"
---

Stop the local stack of the current project and confirm it is down.
**Work autonomously**: only stop to ask for the things listed under "Ask first".

Argument (optional): `$ARGUMENTS` — app/service names to stop only those, or `all` to
also stop project infra that /stack-up didn't start. Empty → everything /stack-up
started.

## Where to look

- Profile: `<main-checkout>/.claude/e2e-test.md` (`## Stack` — ports, stop commands), where
  `<main-checkout>` = `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`.
- Run state: `~/.claude/stack-state/<main-checkout path with / replaced by ->/state.json`
  (written by /stack-up; pids, ports, stop commands, logs).
- No profile and no state → work from what's visible: `package.json` scripts,
  `docker-compose*.yml`, `supabase/config.toml`, and the checks below.

## Steps

1. **List what's running for this project** and mark its origin:
   - `state.json` + `kill -0 <pid>` per recorded app;
   - background tasks of *this* session (e.g. from /e2e-test);
   - `lsof -iTCP -sTCP:LISTEN -P -n` filtered on the profile's ports;
   - `docker ps` filtered on the compose project; `supabase status`.
   ```
   Running dev infra for <project>
     [started by /stack-up]  api-server       :4000   pid 12345   → production DB [production]
     [started by /stack-up]  supabase local   :54321-54324 (docker)
     [other]                 redis (docker compose)  :6379
   ```
   Show each item's target and class from `state.json` when known, so a component
   connected to production stands out.
   Nothing running → say so, clean up stale state, and stop.

2. **Stop** — the selection from `$ARGUMENTS`; empty → all `[started by /stack-up]` items.
   `[other]` items only with `all` or a name in `$ARGUMENTS`; when empty and there are
   `[other]` items, ask with AskUserQuestion (multiSelect) whether to stop those too
   (options: none (recommended), each item).
   - Apps (pid): `kill <pid>` (also its process group/children if it spawned any,
     e.g. `pkill -TERM -P <pid>`), wait up to ~10 s, then `kill -9` only if still alive.
     Verify the pid still belongs to the expected command (`ps -p <pid> -o command=`)
     before killing — pids get reused.
   - Background tasks of this session: TaskStop.
   - Docker compose: `docker compose stop <services>` (keeps containers and volumes).
   - Supabase local: `supabase stop` (keeps the data).
   - Reverse dependency order: frontend → API → backing services.

3. **Verify** with the same checks as step 1 that everything selected is really down
   (ports free, pids gone, containers stopped). Update `state.json`: remove stopped
   items; delete the file when empty. Keep the logs.

4. **Report**
   ```
   Local stack — <project>
     [stopped]       api-server       :4000   (was → production DB)
     [stopped]       supabase local   (data kept)
     [still running] redis (docker compose)  :6379   — not started by /stack-up
   Logs kept in: <state dir>
   ```

## Ask first (everything else: just do it)
- Stopping anything not started by /stack-up, unless named in `$ARGUMENTS` or `all`.
- Killing a process whose command doesn't match what was recorded.

## Rules
- Never delete data: no `docker compose down -v`, no `supabase stop --no-backup`, no
  `supabase db reset`, no removing volumes.
- Never touch remote systems — this is local-only.
- Never kill processes that don't belong to this project.
- Report honestly: something that's still up is `still running`, never `stopped`.
