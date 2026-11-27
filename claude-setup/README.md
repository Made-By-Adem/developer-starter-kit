# Claude setup

A complete Claude Code setup you can install on your own computer: global instructions,
skills, commands, safety hooks, a status line and VS Code settings. It is a working
developer's daily setup with everything personal taken out.

**The easy way:** open Claude Code in this repository and say *"set up my dev
environment"*. Claude follows [`SETUP-FOR-AI.md`](../SETUP-FOR-AI.md), backs up what you
already have and never overwrites your own files.

## What is in here

| Path | Goes to | What it is |
|------|---------|------------|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Instructions for every project: which workflow for which task, and a few hard safety rules |
| `settings.json` | merged into `~/.claude/settings.json` | Permissions, the four hooks and the status line |
| `skills/` | `~/.claude/skills/` | 27 skills (see below) |
| `commands/` | `~/.claude/commands/` | 5 slash commands (see below) |
| `hooks/` | `~/.claude/hooks/` | 4 hooks (need Node.js) |
| `statusline.sh` | `~/.claude/statusline.sh` | Two-line status line (needs bash, Node.js and git) |
| `vscode-settings.json` | merged into your VS Code user settings | Settings for the Claude Code extension |

The agents are not in this folder. They live in [`.claude/agents/`](../.claude/agents/)
and are copied to `~/.claude/agents/`.

On Windows, `~` is your user folder: `C:\Users\<you>`.

## Skills

| Skill | Use it for |
|-------|-----------|
| `feature` | A whole feature: plan, approval, build, review, pull request |
| `plan` | A plan you approve before any code is written |
| `hotfix` | A small bug fix without the full pipeline |
| `review` | Self-check before Claude shows you its changes |
| `pr` | Preparing a clean pull request |
| `backend` | Rules for API and server code |
| `frontend` | Rules for Vue and Nuxt code |
| `ux` | Designing a page or flow before building it |
| `database` | Writing database migrations and access rules |
| `db-inspect` | Looking at the real database schema, read-only |
| `data-fix` | Correcting wrong data in production, safely |
| `deploy` | Preparing and running a deployment |
| `incident` | Step-by-step help when production is broken |
| `log-analysis` | Analysing logs you downloaded |
| `weekly-report` | A weekly report from logs and Git history |
| `release-notes` | A changelog from Git history |
| `upgrade-deps` | Updating packages safely, in small groups |
| `i18n-check` | Finding missing translations |
| `science` | Debugging a bug with an unknown cause: several explanations first, then the cheapest test that tells them apart |
| `root-cause` | Finding out afterwards why something failed, and what prevents it next time |
| `threat-model` | Mapping what could go wrong security-wise before you build: data, entry points, risks |
| `property-test` | Testing a rule on hundreds of generated inputs to find bugs your example tests miss |
| `research` | Looking something up on the web, with every link checked |
| `red-team` | Having your plan attacked to find the flaw that would sink it |
| `council` | A short debate between four experts to choose between options |
| `first-principles` | Sorting real limits from habits, then rebuilding the solution |
| `visualize` | Drawing a flow, a request path or a database as a diagram |

The planning skills (`plan`, `feature`, `hotfix`, `review`) work with **"Done when"
criteria**: before any code is written, the plan says how you will know it is finished,
what must not happen, and which proof shows each point. "It works" without proof is
reported as "not verified".

## Commands

| Command | What it does |
|---------|--------------|
| `/stack-up` | Starts your project's local servers and reports the addresses |
| `/stack-down` | Stops them again and checks that they are really down |
| `/e2e-test` | Tests your current changes in a real browser and reports with evidence |
| `/deploy-option` | Tells you which parts of a deploy script your changes need |
| `/cleanup` | Removes a merged branch and returns you to an up-to-date main branch |

## Hooks

Hooks are small scripts that Claude Code runs before a command or when it finishes
answering. Unlike an instruction in a text file, a hook is enforced.

| Hook | What it stops |
|------|---------------|
| `block-migration-apply.cjs` | Force-pushes, and it asks you first before a migration reaches a remote database or a local database is reset |
| `block-sleep.cjs` | Waiting in a loop, which wastes your usage |
| `block-pkill-extra-args.cjs` | A mistyped `pkill` that would close unrelated apps on a Mac |
| `verify-claim.cjs` | Nothing yet: it only keeps a log (see below) |

**`verify-claim.cjs`** runs when Claude finishes an answer. It looks for one pattern:
Claude changed files, then said "works", "fixed" or "done", without running anything
after the last change. In that case it adds one line to `~/.claude/logs/verify-claim.jsonl`
(the time, the folder and the word it matched, never the text of the conversation). It
does not interrupt you. Read the log after a week or two. If the hits are real, switch
it to blocking by adding `"VERIFY_CLAIM_MODE": "block"` to the `env` section of
`~/.claude/settings.json`: Claude is then sent back once to show proof or to say
"not verified".

## Good to know

- **These skills come from real projects** that use Express, Vue or Nuxt, and Supabase
  with several customers in one database. They mention things such as `namespace_id`
  (the column that says which customer a row belongs to), "secure views" and encrypted
  columns. Where your project does not have those, the skill skips them. Edit the files
  to fit how you work.
- **`db-inspect`, `data-fix` and `incident` use the Supabase connector** for Claude. Without
  it they still work, but Claude cannot look into the database by itself.
- **`/e2e-test` uses the Claude in Chrome extension** when it is installed.
- **`settings.json` is merged, not copied.** If you already have settings, your own values
  stay and only missing entries are added.

## Optional extras (made by others)

These are not part of this repository. Install them from their own source if you want
them, and read their licence first.

| What | Source | Install |
|------|--------|---------|
| Feature development workflow | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | `/plugin install feature-dev@claude-plugins-official` |
| Launch videos from your project | [latent-spaces/brag](https://github.com/latent-spaces/brag) | `/plugin marketplace add latent-spaces/brag` then `/plugin install brag@brag` |
| Video compositions in HTML | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | `npx skills add heygen-com/hyperframes` |
| Architecture diagrams | [caru-ini/stack-diagram](https://github.com/caru-ini/stack-diagram) | `npx skills add caru-ini/stack-diagram` |
| Short answers that save tokens | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | `npx skills add JuliusBrussee/caveman` |
| LinkedIn, Instagram and TikTok writing help | [sergebulaev/linkedin-skills](https://github.com/sergebulaev/linkedin-skills), [instagram-skills](https://github.com/sergebulaev/instagram-skills), [tiktok-skills](https://github.com/sergebulaev/tiktok-skills) | `/plugin marketplace add sergebulaev/<name>` then `/plugin install <name>@<name>` |

Install commands change over time. If one fails, follow the README of the source.
