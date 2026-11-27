---
name: feature
description: Full feature pipeline in one command - ACE plan, approval, implement, self-review, offer PR. Use when the user asks to build a feature or any non-trivial multi-file change and wants the whole workflow handled end-to-end.
---

# Feature Pipeline Skill

Orchestrate the complete workflow for a feature. Execute the phases IN ORDER. Never skip a STOP point.

## Phase 0: Triage

- If the task is trivial (1-3 files, no schema/auth/payment/encryption impact):
  say "This looks small — /hotfix is faster. Use the full pipeline anyway?" and wait for the answer.
- Otherwise continue to Phase 1.

## Phase 1: Plan

1. Invoke the **plan** skill (ACE pipeline: codebase-mapper → risk agents → planner).
2. Present the plan.md summary (or the plan-artifact location defined by the project's CLAUDE.md, if it defines one): every file that will change, everything that will NOT change.
3. **STOP — wait for explicit approval ("Approved" or feedback). No code before approval.**

## Phase 2: Implement

1. Hand the approved plan (plan.md, or the plan-artifact location the project's CLAUDE.md defines) to the **implementer** agent.
2. Order is always: DB → API → frontend → verification.
3. Migrations: create the SQL file, then **STOP** — the user reviews and applies migrations manually. NEVER auto-apply.
4. If any step fails or the plan is ambiguous: **STOP and report** — do not improvise.

## Phase 3: Self-Review

1. Invoke the **review** skill on all changes.
2. Fix every failing checklist item BEFORE presenting.
3. If changes touched UI: also verify against the **ux** skill checklist (responsive, i18n, a11y).

## Phase 4: Wrap Up

1. Present the final summary:
   ```
   Feature complete: [name]
   Files changed: [list]
   Migrations awaiting manual review: [list or none]
   Verification: [what was verified and how]
   Deviations from plan: [list or none]
   ```
2. Ask: "Prepare a pull request? (runs /pr)"
3. On yes → invoke the **pr** skill.

## Hard Rules

- NEVER write code before plan approval (Phase 1 STOP).
- NEVER apply migrations automatically.
- NEVER expand scope beyond the approved plan — new ideas go in the wrap-up notes.
- If the user interrupts with a change request mid-pipeline: update plan.md first, re-confirm, then continue.
