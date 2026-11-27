---
name: weekly-report
description: Weekly ops report - run log analysis and usage analysis on LOGFILES/, summarize the week's git activity, compile one report with top action items. Use when the user asks for a weekly report, ops summary, or "how did the system do this week".
---

# Weekly Report Skill

Compile one weekly operations report from logs + git. Follow the steps in order.

> For an ad-hoc analysis of a single log batch, the log-analysis skill is the lighter entry point.

## Steps

### 1. Check log freshness
- Glob `LOGFILES/` for log files and check their date range.
- If logs are missing or older than the report week: **STOP** and ask the user to download fresh logs first (never download them yourself).

### 2. Run the analyses (parallel)
Invoke BOTH agents in a single message so they run concurrently:
- **log-analyser** — errors, performance, security (writes to `LOGFILES/analyses/`)
- **usage-analyser** — user behavior, feature adoption, training needs

### 3. Git activity for the week
For the current repo (or each repo the user names):
```bash
git log --since='1 week ago' --pretty=format:'%h|%ad|%an|%s' --date=short --no-merges
git log --since='1 week ago' --diff-filter=A --name-only -- '*migration*' '*.sql'
```
Summarize: commits, notable features/fixes shipped, migrations applied.

### 4. Compile the report
Write to `LOGFILES/analyses/weekly-report-{YYYY-MM-DD}.md`:

```markdown
# Weekly Report — week of {DATE}

## System Health
**Status:** ✅ / ⚠️ / ❌  (from log-analyser)
| Metric | This week | Status |
|--------|-----------|--------|
| Errors | X | ✅ |
| Auth failures | X | ✅ |
| Slow requests (>2s) | X | ⚠️ |

## Incidents & Findings
[P1/P2 findings from log-analyser — title + one line each; link to the full analysis file]

## Usage Highlights
[From usage-analyser: adoption changes, abandoned flows, training needs — only deviations]

## Shipped This Week
[From git: features, fixes, migrations]

## Top 5 Action Items
| # | Action | Priority | Source |
|---|--------|----------|--------|
| 1 | ... | P1 | log-analysis |
```

### 5. Present
- Show the report summary in chat, mention the file path.
- If any P1 findings exist: lead with them, and offer to start a **hotfix** for the top one.

## Rules
- Never download logs — analysis only runs on what's already in LOGFILES/.
- Deviations only in Usage Highlights — a normal week says "normal week".
- Action items must come from the analyses/git — no generic advice like "consider monitoring".

## Tip (mention to the user once)
This skill can run on a schedule: `/loop` in a dedicated session, or `/schedule` for a recurring routine — provided fresh logs land in LOGFILES/ automatically.
