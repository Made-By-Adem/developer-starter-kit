---
description: End-to-end test the work in progress (PR, branch or uncommitted changes) of the current repo on its own — sets up test infra, drives the app with Claude in Chrome, reports with evidence. Never touches production without explicit permission. Learns the setup per project.
argument-hint: "[PR number | branch | 'uncommitted'] [focus, e.g. 'only the invoice flow']"
---

Test the features in the current change set end to end, the way a careful QA engineer
would: work out what changed, set up whatever is needed to run it, exercise it for real
(browser, API, CLI), and report what works and what doesn't — with evidence.
**Work autonomously**: only stop to ask for the things listed under "Ask first".

Argument (optional): `$ARGUMENTS` — a PR number, a branch name, `uncommitted`, and/or a
free-text focus. Empty → the PR of the checked-out branch, plus any uncommitted changes.

## Safety: production is off-limits by default

Before ANY action that reaches a remote system (HTTP request, browser navigation, DB
connection, Supabase MCP call, queue, mail/SMS/payment provider, webhook), classify the
target:

- **local** — localhost / 127.0.0.1 / docker network / `supabase start` stack → go.
- **test/staging/preview** — explicitly marked as such in the profile, project CLAUDE.md,
  or by name (`staging.`, `test.`, `preview`, a Supabase branch) → go, but only with test
  accounts/tenants and with cleanup.
- **production, or unknown** → **stop and ask** with AskUserQuestion. Treat anything you
  can't positively identify as non-production as production. Say exactly what you want to
  do there (URL/project, read-only or writing, which account/tenant, what data gets
  created and how it is cleaned up). Options: read-only only / read+write in test
  tenant <x> / no.

Permission is **per run and per scope**: a yes for read-only does not cover writes, a yes
today does not cover tomorrow, and a yes is never written to the profile. Even with
permission on production: no deletes or bulk updates of existing data, no real
emails/SMS/payments to real people, no migrations, no deploys, no config changes, only the
agreed test tenant/account, and clean up everything you created.

Also watch for indirect production access: a local app whose `.env` points at the
production database/Supabase project/payment keys **is** production. Check the env
(variable names + hostnames/project refs only — never print secret values) before
starting the app, and if it points at production, don't start it until you have a local
or test alternative or explicit permission.

## The project profile (this is how it learns)

Profile at `<main-checkout>/.claude/e2e-test.md`, where
`<main-checkout>` = `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`
(not a worktree — those get removed). Present → use it but re-verify what you rely on
(commands still exist, ports, scripts). Missing → discover (step 2), write it at the end.
When I correct you, add it to `Notes`. Don't commit it; mention it in the report when it
is new or changed.

```markdown
# E2E test profile
Maintained by /e2e-test. Edit freely — every run re-verifies it.
Last verified: YYYY-MM-DD

## Stack
- Apps: <name> — <path> — start: `<cmd>` — URL: http://localhost:<port> — ready check: `<cmd/url>`
- Install: `<cmd>` (per app)
- Local backing services: `<supabase start | docker compose up -d db redis | …>` — stop: `<cmd>`
- Local DB setup/seed: `<cmd>` — allowed to run without asking: yes/no (answered by me on YYYY-MM-DD)
- Existing test suites: unit `<cmd>` · integration `<cmd>` · e2e `<cmd>` (Playwright/Cypress/…)

## Environments
| Name | URL / project ref | Class (local/test/production) | Notes |
|------|-------------------|-------------------------------|-------|

## Test accounts & tenants
- <role> in tenant <x> — credentials from: `<env var name / password manager entry>` (never the value)
- How to create one locally: `<cmd or UI flow>`

## Notes
- <quirks, corrections from me, flaky areas, things that need mocking>
```

## Steps

1. **Determine the change set**
   ```bash
   git status --porcelain; git branch --show-current
   git fetch origin
   gh pr view $ARGUMENTS --json number,title,body,baseRefName,headRefName,headRefOid,url
   ```
   - PR → `git diff --stat -M origin/<base>...<head>` + full diff of relevant files; read
     the PR body and linked issue for the intended behaviour and acceptance
     criteria.
   - No PR → diff against the default branch; plus uncommitted changes
     (`git diff`, `git diff --cached`, untracked files) — they are part of what gets tested.
   - Requested PR/branch is not the checked-out one → don't touch the current working
     tree: test it in a separate worktree (`git worktree add <scratchpad>/e2e-<branch> <ref>`)
     and remove that worktree at teardown.
   - Empty change set → say so and stop.

2. **Understand the repo and how it runs** (skip what the profile already answers)
   - Project `CLAUDE.md` / `AGENTS.md` / README, `.claude/skills/` (a project skill for
     running the app wins), `package.json` scripts / Makefile / `docker-compose*.yml` /
     `supabase/config.toml` / Procfile, `.env.example` (names only).
   - Existing test setup: Playwright/Cypress/Vitest/Jest/pytest configs, test dirs,
     fixtures, seed scripts, test-user helpers.
   - Environments and their classification (see Safety). Unknown → production.

3. **Write the test plan** (show it briefly, then carry on — no approval needed)
   From the diff and the intended behaviour, list concrete test cases per changed feature:
   - happy path of each user-visible flow / endpoint that changed;
   - edge cases: empty/invalid input, long text, boundaries, double submit, back button;
   - permissions & roles, and **tenant isolation** (user of tenant A must not see/change
     tenant B) whenever data access changed;
   - i18n: changed UI in every supported language (no raw keys, no missing strings);
   - responsive: mobile width when UI changed;
   - regression: neighbouring flows that share the touched code.
   Each case: steps, expected result, layer (browser / API / CLI / existing suite).
   A `$ARGUMENTS` focus narrows the plan to that.

4. **Set up the test infrastructure** — locally, everything you need, by yourself
   - Install dependencies with the project's own package manager/lockfile. **No new
     dependencies** (including Playwright etc.) without asking.
   - Start local backing services (Supabase local, docker compose). Long-running
     processes go in the background (`run_in_background`); wait for readiness with a
     ready-check, not a sleep. Note every process you start, for teardown.
   - Local database: applying migrations or resetting/seeding a **local, disposable**
     database requires my OK once per project — ask the first time, record the answer in
     the profile. Never against any non-local database.
   - Test data: create the users/tenants/records the plan needs via seed scripts, the
     app's own API, or the UI. Prefer a dedicated test tenant. Keep a list of everything
     created.
   - Ports in use, missing env vars, failing build → debug and fix the *setup* (not the
     app code); if a secret is genuinely needed and missing, ask for it — don't invent it.
   - Mock or disable outbound side effects (email, SMS, payments, webhooks) when the
     project supports it (test keys, mail catcher, sandbox mode); otherwise skip those
     steps and mark them "not tested — would send real <x>".

5. **Run the tests**
   - **Existing suites** first, scoped to the affected area, then the full suite if it is
     reasonably fast. Record failures that also fail on the base branch as pre-existing.
   - **Browser (UI flows)**: **always try Claude in Chrome first**, so I can watch along in
     my own Chrome. Don't fall back to headless browsers (Playwright/Puppeteer scripts, the
     built-in browser, curl-scraping a page) for UI checks just because they're faster.
     Fall back only when Claude in Chrome is unavailable after a real attempt: the tools
     can't be loaded, there's no connected browser (`list_connected_browsers`), or the
     extension doesn't respond after 2–3 tries. In that case say so first, with the reason,
     and say which alternative you'll use. The project's existing Playwright/Cypress suite still
     runs as a suite in "Existing suites"; this rule is about the exploratory browser
     testing. Before the first browser step, tell me in one line which tab you're opening and
     what you're about to test there, so I know where to look.
     Load the `anthropic-skills:chrome-browser` skill (or
     `claude-in-chrome`), load all needed Chrome tools in one ToolSearch call
     (tabs_context_mcp, tabs_create_mcp, navigate, computer, read_page, find, form_input,
     get_page_text, read_console_messages, read_network_requests, gif_creator,
     javascript_tool, resize_window, tabs_close_mcp, list_connected_browsers). Work in a **new tab**, never in my
     existing tabs. Per case: screenshot the end state (shown in the conversation), read
     console errors and failed network requests (4xx/5xx). **No GIF recordings by
     default.** gif_creator exports land in my Downloads folder as clutter, and I watch
     live anyway. Record a GIF only when I ask for one, or for a failure that's hard to
     show in a screenshot; mention the file path in the report when you do. Never trigger alert/confirm dialogs blindly. Never type
     real credentials of mine into a page; use test accounts.
     Stuck for 2–3 attempts on the same browser action → note it, move on to the next case,
     report it at the end (don't loop).
   - **API**: curl/httpie against the local server with test tokens; check status codes,
     response shape, and the DB effect (read-only SELECT on the local DB).
   - **Tenant isolation / permissions**: actually try the forbidden access with the other
     tenant's/role's token and confirm it is refused.
   - Found a bug → reproduce it once more to rule out flakiness, capture evidence, find the
     likely cause in the diff (file:line). **Don't fix it** unless I say so; testing and
     fixing are separate.
   - Want to keep a test permanently (e.g. a new Playwright spec in the project's existing
     e2e setup)? Offer it at the end; don't add test files to the repo unasked.

6. **Hand the browser over to me** — after the report, before any teardown
   - Leave the app running, the test data in place, and the test tab open, logged in as
     the test account. Navigate it to the most relevant page of the change, preferably
     the page of a failed case, so I land in the right place.
   - Tell me clearly, as a separate block below the report:
     ```
     Your turn — the app is still running in Chrome
       Tab:      "<tab title>" — <url>
       Logged in as: <test role> in tenant <x>  (password: <where to find it, never the value>)
       Worth trying: <1–3 things the automated run couldn't judge, e.g. how it feels on mobile>
     Click around as long as you like; I won't touch the browser or shut anything down
     until you tell me you're done.
     ```
   - Then ask with AskUserQuestion: "Done looking around?" Options: "Done — continue to
     cleanup", "Not yet". With "Not yet", or when I start asking questions or report
     findings, handle those first (a new bug from me → reproduce it and add it to the report).
     Don't use the browser yourself unless I ask. Move on to teardown only after "Done".
   - Browser was not used in this run (API/CLI only) → skip this step.

7. **Teardown** — always, also after failures (after step 6 when the browser was used)
   - Delete the test data you created (local, and remote with permission).
   - Close the tabs you opened, unless I chose to keep the app running; then leave the
     tab open too.
   - **Dev infra: list it and ask, don't stop it on your own.** List
     everything running for this project, and mark what this run started and what was
     already running:
     ```
     Running dev infra for <project>
       [started by this run]  vite dev server   :5173   (background task <id>)
       [started by this run]  supabase local    :54321-54324 (docker)
       [already running]      redis (docker compose)  :6379
     ```
     Check this with the tracked background tasks, `lsof -iTCP -sTCP:LISTEN -P -n` filtered
     on the profile's ports, `docker ps` filtered on the compose project, and `supabase status`.
     Then ask with AskUserQuestion (multiSelect) what to shut down. Options: everything this
     run started (recommended), everything listed, keep it all running, plus the individual items.
     Only stop what I pick, using the profile's stop commands (`supabase stop`,
     `docker compose stop`, TaskStop for background tasks). Afterwards, confirm with the
     same checks that it is really down. Nothing is running → say so and skip the question.
   - Remove the temporary worktree only after any dev server running from it has been
     stopped. If I keep that server running, keep the worktree too, and tell me its path
     and the cleanup command.
   - `git status` must look exactly as before the run (apart from the profile).

8. **Save the profile** (new or updated) with today's date.

## Report

```
E2E test — PR #<n> <head> → <base>   (or: <branch> + uncommitted, no PR)
Environment: local (supabase local + vite :5173)  |  production touched: no / yes, read-only, with OK
Browser: Claude in Chrome  (or: <fallback> — because <reason>)

Result: 9 passed · 2 failed · 1 not tested

| # | Case                                   | Layer   | Result | Evidence |
|---|----------------------------------------|---------|--------|----------|
| 1 | Create invoice as admin                | browser | PASS   | screenshot |
| 2 | Tenant B cannot open tenant A invoice  | API     | FAIL   | 200 instead of 403 |
| 3 | Invoice email                          | —       | SKIP   | would send real mail |

Failures
2. Tenant B can read tenant A invoice
   Repro: GET /api/invoices/<id> with tenant-B token → 200 + body
   Expected 403. Likely cause: services/invoice.js:42 — query not scoped on the tenant id
   Console/network: —

Existing suites: unit 212/212 · e2e 14/15 (1 pre-existing failure on main: checkout.spec.ts)
Not covered / needs a human: <…>
Setup: <what was started, what was created and cleaned up>
(followed by the "Your turn" browser hand-over from step 6, then the running-infra list and shut-down question from step 7)
Profile: <main-checkout>/.claude/e2e-test.md — created / used / updated (<why>)

Next: fix via /hotfix? Add cases 1–2 as Playwright specs?
```

## Ask first (everything else: just do it)
- Any action on production or an unclassifiable environment (see Safety).
- Migrations/reset/seed on a local DB — once per project (stored in the profile).
- Adding dependencies or permanent test files to the repo.
- Missing secrets or credentials.
- Shutting down dev infra after the run (list what runs, I pick what stops).

## Rules
- Never deploy, push, commit, or apply migrations to a non-local database.
- Never print secret values (env files, tokens, passwords) — names and hosts only.
- Never use my personal browser sessions on production sites as a "test account".
- Report honestly: skipped, flaky and not-testable cases are listed as such, never as PASS.
