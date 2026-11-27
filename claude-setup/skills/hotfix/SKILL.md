---
name: hotfix
description: Fast path for small bug fixes - reproduce, root-cause with the debugger agent, minimal fix, self-review, offer PR. Use for single bugs or small changes (1-3 files) where the full planning pipeline is overkill.
---

# Hotfix Skill

Fix a small bug quickly WITHOUT the full planning pipeline. Follow the steps in order.

## Steps

### 1. Understand
- Get: exact error message, steps to reproduce, expected vs actual behavior.
- If logs are relevant and available in LOGFILES/, grep them for the error.
- Reproduce the bug if possible (or state clearly why not).

### 2. Scope Check — decide fast/slow path
Escalate to the **plan** skill (STOP hotfix, tell the user why) if the fix would touch ANY of:
- More than 3 files
- Database schema, migrations, or RLS policies
- Auth, permissions, or encryption
- Payment flows
- Central state or config files that many components depend on

Otherwise continue.

### 3. Diagnose
- For non-obvious bugs: invoke the **debugger** agent for root cause analysis.
- For obvious bugs: diagnose directly, but state the root cause explicitly before fixing.
- Never fix a symptom without naming the root cause.

### 4. Fix
- Minimal change only — no drive-by refactoring, no renaming, no "while I'm here" improvements.
- Follow existing patterns in the surrounding code exactly.
- No new dependencies.

### 5. Verify
- Re-run the reproduction from step 1 — confirm the bug is gone.
- Run the nearest existing tests if the project has them.
- Check the fix didn't break the surrounding behavior (read callers of the changed function).

### 6. Review
- Run the **review** skill checklist on the change.

### 7. Present
```
Hotfix: [bug title]
Root cause: [one sentence]
Fix: [file:line — one sentence]
Verified: [how]
Regression risk: [low/medium + why]
```
Then ask: "Prepare a pull request? (runs /pr)"

## Hard Rules
- Root cause named BEFORE the fix is written.
- One bug per hotfix. A second bug found = report it, don't fix it silently.
- If verification fails → back to step 3, and say so.
