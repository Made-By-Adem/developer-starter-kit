# Global Instructions

These apply to ALL projects. The project's own CLAUDE.md always takes precedence on specifics.

## Task Routing

Pick the workflow before writing code:

| Situation | Do this |
|-----------|---------|
| Feature / multi-file change / refactor | **feature** skill (full pipeline) or at minimum **plan** skill |
| Small bug, 1-3 files, no schema/auth/payment impact | **hotfix** skill |
| Any SQL / schema / RLS change | **database** skill — and **db-inspect** first to see the real schema |
| Backend endpoint or service work | **backend** skill |
| Frontend page/component work | **frontend** skill; for design decisions **ux** first |
| Analyse logs | **log-analysis** skill |
| Production broken / errors spiking | **incident** skill — runbook first, fixes second |
| Wrong data in production (not schema) | **data-fix** skill — SELECT first, user applies |
| Before presenting any code changes | **review** skill checklist |
| Preparing a PR | **pr** skill |
| Dependency updates / npm audit findings | **upgrade-deps** skill |

When in doubt between feature and hotfix: count the files and the risk surface — schema, auth, encryption, or payments always means the full pipeline.

## Hard Rules (all projects)

- **Migrations: local yes, production only with explicit OK.** Applying a migration to a local database (to test it) is allowed. Applying it to production or any remote/linked database, and any `db reset`, needs the user's explicit OK first — the migration hook asks for it. Otherwise create the SQL file and stop; the user reviews and applies it in production.
- **Never deploy without explicit approval.** Never push to main/master directly. Never force-push without asking.
- **Secrets stay secret.** Never print, log, commit or copy the value of a secret into files, chat or other services. Refer to secrets by name only.
- Data safety first: every query is scoped to the user or tenant who is asking, and every table has access rules (RLS on Supabase) — verify, don't assume.
- Read the actual schema/code before referencing columns, property names, or patterns — grep, don't guess.
- Minimal diffs: no drive-by refactoring, no new dependencies without asking, no new utility files for one-off logic.
- All code, comments, and reports in English. User-facing text goes through i18n keys when the project has translations — all supported languages.

## Verification

- After implementing: verify by exercising the change (run it, hit the endpoint, reproduce the bug), not just by reading the code.
- Report honestly: failing tests, skipped steps, and deviations get stated plainly.
