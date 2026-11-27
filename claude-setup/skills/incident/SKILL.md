---
name: incident
description: Production incident runbook - assess impact from logs, correlate with recent deploys, mitigate or hotfix, verify recovery, write a postmortem note. Use when production is broken, users are blocked, errors are spiking, or the user says "incident", "outage", "production down".
---

# Incident Skill

Production is (possibly) broken. Work the runbook IN ORDER — do not skip ahead to fixing before scoping. Stay calm and factual; report what you KNOW vs what you SUSPECT at every step.

## Phase 1: Assess (first 5 minutes)

1. **Establish symptoms** — get from the user: what's broken, since when, who reported it, error messages/screenshots.
2. **Get evidence:**
   - If fresh logs are in `LOGFILES/`: grep them for the error window immediately.
   - If not: ask the user to download logs NOW (never download them yourself), and continue with what you have meanwhile.
   - If Supabase MCP is available: `mcp__claude_ai_Supabase__get_logs` for the API/database error stream.
3. **Scope the blast radius:**
   ```
   IMPACT: [all tenants / specific namespaces / one feature / unclear]
   SEVERITY: [P1 down / P2 degraded / P3 annoyance]
   SINCE: [timestamp of first error]
   ```
4. **STOP — report this assessment to the user before touching anything.**

## Phase 2: Correlate

1. **What changed?** The most likely cause of a new incident is a recent change:
   ```bash
   git log --since='72 hours ago' --oneline --no-merges
   git log --since='72 hours ago' --name-only -- '*.sql'   # migrations!
   ```
2. Match the first-error timestamp against deploy times and migration times.
3. Check the usual suspects table from the **debugger** agent (401→auth config, 500 on DB→RLS/secure views/encryption keys, etc.).
4. State the leading hypothesis WITH confidence level: "LIKELY: migration X changed RLS policy (errors started 4 min after). POSSIBLE: ..."

## Phase 3: Mitigate

Choose the FASTEST safe path back to working — mitigation beats root-cause elegance during an incident:

| Situation | Mitigation |
|-----------|-----------|
| Bad code deploy | Rollback deploy to previous version (deploy skill's rollback steps) |
| Bad migration | Present the DOWN migration for the user to apply manually — NEVER apply it yourself |
| Bad config/env | Present the corrected value, user applies |
| External service down | Confirm with evidence, communicate, monitor — no code changes |
| Genuine code bug, no rollback possible | **hotfix** skill, scoped to the minimal fix |

**STOP — get explicit approval before any mitigation that touches production.**

## Phase 4: Verify Recovery

1. Confirm errors stopped: re-grep logs after mitigation / re-check health endpoints.
2. Verify the affected feature works (ask the user to confirm from the user side).
3. Watch for secondary effects for the next several minutes (queues draining, retries flushing).
4. Do NOT declare recovery on silence alone — absence of new logs ≠ recovery unless traffic exists.

## Phase 5: Postmortem Note

Write to `LOGFILES/analyses/incident-{YYYY-MM-DD}-{slug}.md`:

```markdown
# Incident: [title] — {DATE}

**Severity:** P1/P2/P3 | **Duration:** [first error → verified recovery]
**Impact:** [who/what, quantified from logs]

## Timeline (times from logs, not memory)
- HH:MM first error
- HH:MM detected / reported
- HH:MM mitigation applied
- HH:MM verified recovered

## Root Cause
[What actually happened — or "unconfirmed, leading hypothesis: ..."]

## Fix
[Mitigation applied + permanent fix status]

## Follow-ups
- [ ] Permanent fix (if mitigation was a rollback)
- [ ] Test that would have caught this (hand to test-writer agent)
- [ ] Monitoring/alert gap
```

## Hard Rules
- Scoping before fixing — a wrong fix during an incident makes two incidents.
- NEVER apply migrations or rollback-migrations yourself — present SQL, user applies.
- Every mitigation needs explicit approval. Every claim needs a log line or command output behind it.
- If the incident involves payments or data corruption: say so immediately and treat as P1 regardless of scope.
