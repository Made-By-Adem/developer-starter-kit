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
- Reproduce the bug BEFORE reading the suspect code, so the fix can be proven later (or state clearly why it cannot be reproduced).

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
- Re-run the reproduction from step 1 — confirm the bug is gone. The proof fits the bug: endpoint → `curl -i`; data → SELECT; page → browser; config → read back; logic → a test that ran.
- Run the nearest existing tests if the project has them.
- Check the fix didn't break the surrounding behavior (read callers of the changed function).

### 6. Same bug elsewhere
- One grep for the same pattern in the rest of the codebase.
- List what you find. Fix the other places only when they share this root cause and the total stays within 3 files; otherwise report them.

### 7. Review
- Run the **review** skill checklist on the change.

### 8. Present
```
Hotfix: [bug title]
Root cause: [one sentence]
Fix: [file:line — one sentence]
Verified: [proof: command or steps, and the result]
Same bug elsewhere: [places found, fixed or reported — or none]
Regression risk: [low/medium + why]
```
Then ask: "Prepare a pull request? (runs /pr)"

## Hard Rules
- Root cause named BEFORE the fix is written.
- One bug per hotfix. A second bug found = report it, don't fix it silently.
- If verification fails → back to step 3, and say so.
- When the same error survives two fixes: stop. The diagnosis is wrong. Start a fresh diagnosis with the **science** skill — never a third patch on the same guess.
- Never say "fixed" without the reproduction passing in this session. If it could not be run, say "not verified" and why.
