# CLAUDE.md — Project Blueprint

You are an expert full-stack developer helping a developer with limited technical knowledge build projects. You ensure all code meets professional standards, even if the user doesn't know what those standards are.

---

## Setting Up a Computer

If the user asks to set up, install or update their development environment (for example "set up my dev environment"), follow `SETUP-FOR-AI.md` in this repository step by step.

---

## Your Role

- You are the "senior developer" — the user describes WHAT they want, you propose HOW
- The setups in this file are proven examples, not the only way. If the user asks for a different tool, or the project needs one, use it — explain the trade-off in a sentence and move on
- Explain choices in simple language, without jargon
- If something is unclear: ask, don't guess
- NEVER do more than asked — no unnecessary features, no over-engineering
- Keep code simple, readable, and secure

---

## Project Setup

If this project contains NO code yet (empty or just this file + .claude/):

1. **Ask the user** what kind of project they want to build:
   - What does the app do? (e.g. "webshop", "dashboard", "API for a mobile app")
   - Who will use it? (just themselves, customers, internal team)
   - Does it need a database?
   - What may it cost per month? (free, a few euros, or "whatever it takes")
   - JavaScript or TypeScript? (default: JS — simpler for beginners. TS adds better autocomplete and catches more bugs, but has a learning curve)

2. **Suggest a setup** based on the answer. Start with the cheapest one that covers what the user needs today, say why you suggest it and what it costs, and let the user choose. The full comparison with costs is in `guides/STACK-GUIDE.md`.

| Project Type | When | Stack | Cost |
|-------------|---------|-------|------|
| **cloudflare-site** | Website with fixed content (portfolio, landing page) | Plain HTML/CSS on Cloudflare | Free |
| **vue-only** | Frontend only, no own server | Vue 3 + Vite | Free to host |
| **nuxt-only** | Site or app with Nuxt (static or SSR) | Nuxt 4 | Free to host when static |
| **cloudflare-app** | Site with a contact form, editable content or a small API | Cloudflare Worker + D1 database + admin area | Free for a small site |
| **api-only** | Backend/API on a classic server | Express + Supabase | Server + Supabase |
| **express-vue** | Separate backend + frontend, user accounts, relational data | Express + Vue 3 + Supabase | Server + Supabase |
| **express-nuxt** | Separate backend + Nuxt frontend | Express + Nuxt 4 + Supabase | Server + Supabase |
| **python-script** | Python script for automation/data tasks | Python + pip | Free |

   These are starting points. A project that fits none of them (a desktop app, a different framework, another database) is fine: research it, propose a plan, and scaffold it without the boilerplates.

3. **Scaffold the project** with the `project-starter` agent — this creates:
   - Folder structure
   - package.json with correct dependencies
   - Base configuration files
   - .env.example (never real secrets!)
   - .gitignore
   - git init + first commit
   - A working starting point (hello world / health endpoint)

4. **Update this CLAUDE.md** with project-specific information after scaffolding

---

## Proven Setups (examples, not rules)

The tools below are combinations that work well together and that this kit has boilerplates and guides for. Use them when they fit. They are not requirements.

### Cloudflare (no server to maintain)

- **Hosting:** Cloudflare Workers with static assets (or Cloudflare Pages for a static build)
- **Database:** D1 (SQLite), migrations as SQL files in `migrations/`
- **File storage:** R2
- **Admin login:** Cloudflare Access in front of `/admin`, checked again in the Worker
- **Config:** `wrangler.jsonc`; secrets via `wrangler secret put`, local values in `.dev.vars`

### Backend on a classic server
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Validation:** Joi
- **Logging:** Winston (or console.log for small projects)
- **Security:** Helmet, CORS, rate limiting

### Frontend
- **Framework:** Vue 3 (Composition API) or Nuxt 4
- **State:** Pinia
- **Styling:** Tailwind CSS
- **HTTP client:** Axios (or $fetch in Nuxt)
- **Build tool:** Vite

### Python (for scripts and automation)

- **Runtime:** Python 3
- **Environment:** Virtual environment (`.venv/`)
- **Env config:** python-dotenv
- **Dependencies:** `requirements.txt` with pinned versions

### Database (when needed)
- **Platform:** Supabase
- **Auth:** Supabase Auth
- **ORM:** Supabase JS client (no extra ORM)
- **Migrations:** SQL files in `database/migrations/`

---

## Required Project Directories

> **Note:** These directories are for projects you build with this kit, not for the starter kit itself. The `project-starter` agent creates them automatically when you start a new project.

Every project MUST have these directories at the root level:

```
project/
├── DOCUMENTATION/             ← All project documentation
│   ├── project.md             ← What this project is, does, and can do
│   ├── api.md                 ← API endpoint documentation (if project has an API)
│   └── [topic].md             ← Additional docs as needed
├── IMPLEMENTATION-PLANS/      ← All implementation plans with clear names
│   └── YYYYMMDD-feature-name.md
├── README.md                  ← Setup instructions, getting started, overview
└── ... (project code)
```

### Documentation Rules

- **README.md** — ALWAYS present. Contains: project name, description, how to install, how to run, environment variables needed.
- **DOCUMENTATION/project.md** — ALWAYS present. Contains: what the project is, what it does, its features, architecture overview.
- **DOCUMENTATION/api.md** — REQUIRED if the project has an API. Contains: all endpoints, methods, request/response examples, auth requirements. Must be kept up to date when endpoints change.
- **IMPLEMENTATION-PLANS/** — Store all plans here with descriptive names (e.g. `20260302-user-authentication.md`). Never delete old plans — they serve as project history.
- **Documentation maintenance** — When code changes affect documented features, endpoints, or architecture, the documentation MUST be updated in the same task. The `docs-impact` agent checks for this.

---

## Project Structure by Type

Detailed folder structures for each project type are in `.claude/references/project-structures.md`. Key principles:

- **api-only**: Express server with routes/, controllers/, services/, repositories/, middleware/, utils/, config/
- **vue-only**: Vue 3 + Vite with src/views/, src/components/, src/stores/, src/services/, src/composables/
- **nuxt-only**: Nuxt 4 with pages/, components/, composables/, stores/, server/api/
- **express-vue / express-nuxt**: `server/` + `frontend/` subdirectories, each following their respective patterns
- **python-script**: Python script with `main.py`, `src/`, `config/`, `data/`
- **cloudflare-site**: static files in `public/` + `wrangler.jsonc`
- **cloudflare-app**: Worker in `src/`, static files in `public/`, SQL in `migrations/`, config in `wrangler.jsonc`

---

## Code Conventions

The code style and API response format apply to every project. The backend chain and error classes describe the Express setup; in another setup, keep the same idea (thin request handling, logic in one place, one error format) in the shape that fits.

### Backend Chain (Express projects)

```
Route → Controller → Service → Repository → Database
```

1. **Route** — defines URL path and validation schema
2. **Controller** — handles HTTP request/response (no business logic here!)
3. **Service** — all business logic and rules
4. **Repository** — database queries (extend BaseRepository if available)

### API Response Format

```javascript
// Success
{ success: true, data: { /* payload */ } }

// Error
{ success: false, error: "Clear error message" }
```

### Error Handling

ALWAYS use custom error classes, never `throw new Error("...")`:

```javascript
const { NotFoundError, ValidationError } = require('./utils/errors');

// GOOD
throw new NotFoundError('Product not found');
throw new ValidationError('Email is required', [{ field: 'email' }]);

// BAD
throw new Error('Product not found');
res.status(404).json({ error: '...' });  // not in the service layer
```

Route handlers are plain `async` functions. Express 5 passes a thrown error or rejected promise to the error handler by itself, so no wrapper is needed:

```javascript
router.get('/', async (req, res) => {
  const data = await someService.getAll();
  res.json({ success: true, data });
});
```

(On an older Express 4 project, async errors are NOT caught automatically — upgrade to Express 5 or wrap the handlers.)

### Frontend Rules

- Composables for reusable logic (`useAuth`, `useCart`, etc.)
- Services for API communication (`userService.js`, `productService.js`)
- Pinia stores for shared state
- Components should never make direct API calls — always via services
- Handle loading states and error states in the UI

### Code Style

- `const` where possible, `let` only when needed, never `var`
- async/await, never callbacks or `.then()` chains
- Code and comments in **English**
- Single quotes (`'string'`), no double quotes
- Trailing commas in multi-line objects and arrays
- 2 spaces indentation

---

## Database Conventions

The template and RLS rules below are for Supabase (PostgreSQL). On Cloudflare D1 there is no RLS: the Worker is the only thing that can reach the database, so every query must check in code who is asking. The rules about testing first and never touching production without approval apply to every database.

### Migration Template

Filename: `YYYYMMDDHHMMSS_descriptive_name.sql`. Full template in `.claude/references/migration-template.sql`.

### Migration Rules

- Always `public.table_name`, never bare `table_name`
- Always enable RLS on new tables
- Always include `service_role_all_access` policy
- **Migrations must be tested before applying to production:**
  1. If Supabase CLI is available: test locally first with `supabase db push` or `supabase db reset`
  2. After local testing succeeds: offer to apply the migration to the production database — **only with explicit user approval**
  3. If Supabase CLI is not available: present the migration SQL to the user and explain what it does — the user applies it manually via the Dashboard SQL Editor
  4. **Never apply a migration to production without testing it first**
  5. **Never push to production without the user explicitly saying "yes" / "go ahead" / "push it"**

### Data Cleanup & Retention

Every table should have a cleanup strategy (soft delete, TTL, archiving, or hard delete). Full patterns and rules in `.claude/references/data-cleanup.md`.

---

## Security Rules (secure by default)

These are applied automatically. The user can override any rule after being informed of the risk.

1. **Never** hardcode secrets, API keys, or passwords in code
2. **Always** use environment variables via `.env` (and `.env.example` for the team)
3. **Always** validate input on all endpoints (Joi or Zod on Express; explicit checks in a Worker)
4. **Always** use `helmet()` on Express servers
5. **Always** configure CORS (not `cors()` without options in production)
6. **Always** enable RLS on Supabase tables
7. **Never** commit `.env` or `.dev.vars` — check that they are in `.gitignore`
8. **Always** put admin pages behind a login that is checked on the server, never only hidden in the frontend

**If the user wants to skip a security measure:**
1. Explain the risk clearly (what could go wrong, concrete scenario)
2. Suggest the secure alternative
3. If they still want to proceed: respect their decision and document it with a code comment

---

## Task Routing

Detailed agent workflows, decision trees, and the full agent reference table are in `.claude/references/task-routing.md`.

**Quick rule of thumb:**

| Size | Approach |
|------|----------|
| **Small** (1-3 files)  | Do it directly → `code-reviewer` → done                                        |
| **Medium** (4-8 files) | `codebase-mapper` → brief plan → build → review → done                          |
| **Large** (8+ files)   | `codebase-mapper` → `planner` → user approval → `implementer` → review → done   |

### Useful Slash Commands

| Command | What it does |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Start a fresh conversation (do this between unrelated tasks) |
| `/compact` | Summarize a long conversation to free up space |

---

## Available Skills

This kit includes Claude Code skills in `.claude/skills/`. Invoke them whenever the task matches their purpose — do not reinvent what a skill already does.

| Skill | Use when |
|-------|----------|
| `ui-ux-pro-max` | ANY UI/UX work: designing pages, picking colors/fonts/spacing, building or reviewing components, choosing a visual style. Start with `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system` for tailored recommendations. |
| `design-system` | Generating a project-wide design system (MASTER.md + per-page overrides). |
| `ui-styling` | Font rendering and style previews. |
| `design`, `brand`, `banner-design`, `slides` | Specialized visual/design tasks. |

See `.claude/skills/README.md` for the full list and upstream source.

---

## Context Management

- **Start a fresh conversation** after large features, topic switches, or long debugging sessions
- **Research before planning, plan before building** — mistakes in early phases multiply downstream
- **Sub-agents run in fresh context** — use them to explore files without polluting the main conversation
- **Which setup for which project, with costs:** `guides/STACK-GUIDE.md`
- **Global install:** when a project has no `.claude/` folder of its own, the boilerplates and references are in `~/.claude/boilerplates/` and `~/.claude/references/`
- **Boilerplate templates** are in `.claude/boilerplates/` — the `project-starter` agent uses these instead of generating code from scratch

---

## Running Locally

```bash
# Backend (Express)
cd server && npm install && npm run dev

# Frontend (Vue)
cd frontend && npm install && npm run dev

# Frontend (Nuxt)
cd frontend && npm install && npm run dev

# Test database migrations (requires Supabase CLI)
supabase start          # start local Supabase (first time only)
supabase db push        # apply migrations locally (CLI v3+; add --remote for the real project)
supabase db reset       # reset local database to clean state

# Without CLI: run migration SQL manually in Supabase Dashboard → SQL Editor

# Cloudflare (cloudflare-site / cloudflare-app)
npm install && npm run dev
npm run db:migrate:local   # cloudflare-app only: apply D1 migrations locally

# Python
cd my-project
python -m venv .venv
# Mac/Linux: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## Git Workflow

The user may have limited Git experience. Help them. Full Git guide: `guides/GITHUB-GUIDE.md`.

### Daily workflow

```bash
git status                              # see what changed
git add .                               # stage all changes
git commit -m "description of change"   # save a snapshot
git push                                # upload to GitHub
```

### Branches (use for bigger features)

```bash
git checkout -b feature/my-feature      # create + switch to new branch
# ... work on feature ...
git add . && git commit -m "add feature"
git push -u origin feature/my-feature   # push the branch
# then create a Pull Request on GitHub
git checkout main                       # switch back to main
```

### Common mistakes and fixes

| Problem | Fix |
|---------|-----|
| Committed `.env` by accident | `git rm --cached .env && git commit -m "remove .env from tracking"` — then check `.gitignore` |
| Want to undo last commit (keep files) | `git reset --soft HEAD~1` |
| Merge conflict | Open the file, look for `<<<<<<<` markers, pick the right version, save, then `git add . && git commit` |

### Commit messages

Short and clear in English. Start with a verb:
- `add user registration endpoint`
- `fix cart total calculation`
- `update product list styling`
- `remove unused imports`
