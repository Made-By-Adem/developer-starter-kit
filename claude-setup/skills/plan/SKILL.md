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

6. **Present plan to user**:
   - Show the plan.md summary
   - List every file that will be changed
   - List what will NOT be changed
   - Wait for explicit approval: "Approved" or feedback

7. **On approval**: Hand off to implementer agent or proceed manually
8. **On feedback**: Revise plan and re-present

## Rules

- NEVER write code before plan is approved
- NEVER apply migrations automatically
- Keep plans under 200 lines
- Agent model tiers are defined by each agent's own frontmatter — do not assume or hardcode a tier here
- Some projects keep plans as permanent history (never delete them) — honor the project's CLAUDE.md on plan storage and lifecycle
- If the task is trivial (single file, obvious change), ask: "This seems simple enough to do directly — still want a full plan?"
