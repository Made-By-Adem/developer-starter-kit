---
description: Start the local dev stack of the current repo (backing services + apps), wire each component to the target I pick (local/dev/prod, discovered from the repo), wait until ready, and report the URLs. Production only on explicit choice + confirmation per run. Shares the project profile with /e2e-test.
argument-hint: "[app name(s) | 'services'] [component=target, e.g. 'api-server=dev webapp=local' | 'all=dev']"
---

Start the local stack of the current project so I can work on it: backing services
(Supabase local, docker compose, …), then the apps, each verified with a ready check.
**Work autonomously**: only stop to ask for the things listed under "Ask first".

Argument (optional): `$ARGUMENTS` — app names from the profile to start only those, or
`services` for backing services only; plus `<component>=<target>` pairs to pick what
each component connects to (`all=<target>` for every component that has it). Empty →
the whole stack, targets chosen in step 3.

## Safety: targets and production

Components can often be wired to different targets — an API server against the local,
dev or production DB; a webapp against the local, dev or production API. Every
component gets a **target per run** (step 3), and the target classes follow /e2e-test:
**local** · **test** (dev/staging/preview, positively identified as such) ·
**production**. Anything you can't positively identify as local or test is production.

- Default target is always the most local one available (local → test). Never pick
  production on your own, not even when it's the only configured option.
- **Production only with my explicit choice for this run**: picked by me in the step 3
  question or named in `$ARGUMENTS` (`api-server=prod`) — and then confirm once more
  with AskUserQuestion, saying exactly what will connect to what (component → host /
  project ref) and what it can write (e.g. "orders will be written to the production
  DB"). Never stored in the profile or state as a standing choice; the next run asks
  again.
- Check the env actually in effect after applying the target (variable **names** and
  hostnames/project refs only — never print secret values). If it resolves to a
  different class than chosen (e.g. "dev" but the host is the production project), stop
  and tell me which variables point where.
- Watch the chain: a local webapp → local API → production DB is production for both.
  Report the effective class per component, following the chain.

## The project profile (shared with /e2e-test)

Profile at `<main-checkout>/.claude/e2e-test.md`, where
`<main-checkout>` = `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`.
Use its `## Stack` section (apps, start commands, ports, ready checks, backing services,
stop commands, local DB setup). Present → use it but re-verify what you rely on
(scripts still exist, ports, compose file). Missing or no Stack section → discover
(step 1) and write the Stack section in the same format /e2e-test uses (create the
file with the /e2e-test template if it doesn't exist; leave the other sections as
placeholders). When I correct you, add it to `Notes`. Don't commit it.

Also keep a `## Targets` section there (after `## Environments`) with what step 1
discovered — options only, never a chosen production target:
```markdown
## Targets
| Component  | Target | Select with                     | Points to                 | Class      |
|------------|--------|---------------------------------|---------------------------|------------|
| api-server | local  | `npm run dev`                   | supabase local :54322     | local      |
| api-server | dev    | `npm run dev -- --env .env.dev` | db.dev.example.com        | test       |
| api-server | prod   | `npm run dev:prod`              | <prod project ref>        | production |
| webapp     | local  | `VITE_API_URL=http://localhost:4000 npm run dev` | local api-server | (chain) |
```

## Run state (so /stack-down works from any session)

Background tasks die with the session, so start long-running app processes **detached**
and record them in a state dir outside the repo:
`~/.claude/stack-state/<main-checkout path with / replaced by ->/`
- `state.json` — `{"started": "<ISO time>", "cwd": "<dir the apps run from>", "items": [{"name", "kind": "app|compose|supabase|other", "pid"?, "port"?, "target"?, "class"?, "stop": "<cmd>"}]}`
- `<app>.log` — stdout/stderr of each app.

Start an app like this (from the app's directory):
```bash
nohup <start cmd> > "$STATE_DIR/<app>.log" 2>&1 & echo $! > "$STATE_DIR/<app>.pid"
```
Merge into an existing `state.json` instead of overwriting it.

## Steps

1. **Understand how it runs** (skip what the profile already answers)
   - Project `CLAUDE.md` / `AGENTS.md` / README, `.claude/skills/` (a project skill for
     running the app wins), `package.json` scripts / Makefile / `docker-compose*.yml` /
     `supabase/config.toml` / Procfile, `.env.example` (names only).
   - Run from the current working directory — in a worktree that is the worktree, not
     the main checkout.
   - **Discover the target options per component, from the repo itself** (the profile is
     a cache, re-verify it): env file variants (`.env`, `.env.local`, `.env.development`,
     `.env.staging`, `.env.production`, `.env.*.example`), mode-aware tooling (Vite/Nuxt
     `--mode`, `NODE_ENV`, `dotenv -e`), scripts per target (`dev`, `dev:prod`,
     `start:staging`, Makefile targets), compose profiles/override files, config files with
     per-environment sections (`config/*.json`, `appsettings.*.json`, …), and variables
     that select the upstream (`DATABASE_URL`, `SUPABASE_URL`, `VITE_API_URL`,
     `API_BASE_URL`, …). For each component record: target name, how to select it
     (script / env file / mode / variable override), the upstream it then points to
     (host / project ref, no secrets), and its class. Also record dependencies between
     components (webapp → api-server → DB), so a target can be "the local api-server".
     Unclear how to select a target → note it as "manual", don't invent a mechanism.

2. **Check what is already running**
   - `state.json` + `kill -0 <pid>` per recorded app; `lsof -iTCP -sTCP:LISTEN -P -n`
     filtered on the profile's ports; `docker ps` filtered on the compose project;
     `supabase status`.
   - Already running and healthy (ready check passes) → leave it, mark it "already
     running". Port taken by something else (other project, stale process) → show what
     holds it (`lsof -i :<port>`) and ask before killing it; otherwise use another port
     only if the app supports that cleanly.
   - Stale entries in `state.json` (pid dead) → remove them.

3. **Choose the targets**
   - Components with a single (local/test) option → use it. Targets given in
     `$ARGUMENTS` → use those (production still gets the confirmation from Safety).
   - Otherwise one AskUserQuestion with a question per component that has a choice
     (max 4 per call; more → follow-up call), options = the discovered targets with the
     upstream they point to, most local first marked "(Recommended)". Production options
     are labelled `PRODUCTION — <host/ref>`.
   - Keep the chain consistent: webapp → "local api-server" means the api-server gets
     started too.
   - Show the resulting wiring in one block before starting:
     ```
     webapp      → local api-server (http://localhost:4000)   [local]
     api-server  → dev DB (db.dev.example.com)                [test]
     ```

4. **Prepare**
   - Dependencies missing or lockfile newer than the install → install with the
     project's own package manager/lockfile. **No new dependencies.**
   - Apply each component's target the way the repo does it (script, env file, mode,
     variable override on the command line) — never by editing or overwriting the
     repo's env files. Then the env check from Safety.

5. **Start backing services** (`supabase start`, `docker compose up -d <services>`, …)
   and wait with a ready check, not a sleep. Record them in `state.json` with their
   stop command.
   - Local DB migrations/reset/seed: only if the profile says it's allowed without
     asking; otherwise ask once per project and record the answer in the profile.
     Never against a non-local database.

6. **Start the apps** detached (see Run state), in dependency order (API before
   frontend). Wait for each with its ready check (poll the URL/port, max ~2 minutes;
   use the Monitor tool with an until-loop, no foreground `sleep`). Not ready in time or
   the process died → show the last ~30 lines of its log, debug the *setup* (port, env,
   build), not the app code. If it stays broken, report it and continue with the rest.

7. **Report**
   ```
   Local stack — <project>   (<branch>, from <cwd>)
     [started]          supabase local   API http://localhost:54321 · Studio http://localhost:54323
     [started]          api-server       http://localhost:4000   → dev DB [test]   pid 12345   log: <state dir>/api-server.log
     [already running]  webapp           http://localhost:5173   → local api-server [test, via chain]
     [failed]           worker           port 6379 in use by <process> — see log
   Production touched: no   (or: YES — api-server → production DB, confirmed by you)
   Stop with: /stack-down
   Profile: <main-checkout>/.claude/e2e-test.md — used / created / updated (<why>)
   ```

## Ask first (everything else: just do it)
- Any component connecting to production or an unclassifiable target (explicit choice + confirmation, every run).
- Which target per component, when the repo offers a choice and `$ARGUMENTS` doesn't say.
- Migrations/reset/seed on a local DB — once per project (stored in the profile).
- Killing a process that holds a port and wasn't started by /stack-up.
- Adding dependencies; missing secrets or credentials.

## Rules
- Never deploy, push, commit, or apply migrations to a non-local database.
- Never print secret values — names and hosts only.
- Don't open a browser unless I ask.
- Report honestly: an app that didn't pass its ready check is `failed`, never `started`.
