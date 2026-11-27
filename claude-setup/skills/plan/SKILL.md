---
name: plan
description: ACE planning pipeline - map the codebase, run risk research agents in parallel, and produce an approved plan.md BEFORE any code is written. Use for multi-file features, refactors, schema changes, or any non-trivial task.
---

# Plan Skill

Before writing ANY code, follow the ACE pipeline to create an approved implementation plan.

## Steps

1. **Announce**: "Starting ACE planning pipeline — no code will be written until plan is approved."

2. **Map** (codebase-mapper agent):
   - Identify all affected files, dependencies, and data flows
   - Output: Codebase Impact Map

3. **Research** (parallel agents):
   - If schema changes: run **migration-risk** agent
   - If production deploy: run **release-risk** agent
   - If existing tests affected: run **test-impact** agent
   - If documentation affected: run **docs-impact** agent

4. **Compile research.md**:
   - Combine all agent outputs into a single `research.md` artifact

5. **Plan** (planner agent):
   - Consume research.md and produce `plan.md` (or the plan-artifact location defined by the project's CLAUDE.md, if it defines one)
   - Sequenced: DB → API → frontend → verification
   - Every step has exact file paths and rollback
   - A **Done when** section (see below)

6. **Present plan to user**:
   - Show the plan.md summary
   - List every file that will be changed
   - List what will NOT be changed
   - Wait for explicit approval: "Approved" or feedback

7. **On approval**: Hand off to implementer agent or proceed manually
8. **On feedback**: Revise plan and re-present

## Done when

Every plan states, before any code exists, how we will know it is finished. The user approves these criteria together with the plan.

- **Criteria**: each one is a single checkable statement with the proof that will show it. "Works well" is not a criterion. "`GET /api/orders` returns only rows of the caller's tenant — proof: `curl -i` as tenant A and as tenant B" is.
- **At least one anti-criterion**: something that must NOT happen. Examples: no query without tenant scope, no existing endpoint changes its response shape, no secret in a log line.
- **Baseline**: what already works and must still work afterwards, and the check that shows it (existing tests, a request recorded before the change).
- **Proof matches the type of claim**:

| Claim about | Proof |
|-------------|-------|
| An endpoint | `curl -i`: status code and body |
| The database schema or data | A SELECT, or the **db-inspect** skill |
| A page or component | Opened in a browser, with what was seen |
| Config or a setting | Read back after writing |
| Logic | A test that ran, with its output |
| A deployment | A request to the live address |

Reading the code is not proof that it runs.

## Rules

- NEVER write code before plan is approved
- NEVER present a plan without a Done when section
- NEVER apply migrations automatically
- Keep plans under 200 lines
- Agent model tiers are defined by each agent's own frontmatter — do not assume or hardcode a tier here
- Some projects keep plans as permanent history (never delete them) — honor the project's CLAUDE.md on plan storage and lifecycle
- If the task is trivial (single file, obvious change), ask: "This seems simple enough to do directly — still want a full plan?"
