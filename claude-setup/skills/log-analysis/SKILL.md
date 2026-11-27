---
name: log-analysis
description: Analyse already-downloaded logs in the LOGFILES/ directory using the log-analyser agent (plus usage-analyser for user behavior). Use when the user asks to analyse, check, or review server or app logs.
---

# Log Analysis Skill

Analyse logs in the LOGFILES/ directory using the log-analyser agent.

## Steps

1. Check which log files are available in `LOGFILES/` (server-logs, app-logs, etc.)
2. Invoke the **log-analyser** agent to perform the analysis
3. If app logs are present and the user wants usage analysis, also invoke the **usage-analyser** agent
4. Present the analysis report to the user
5. Ask user for refinements before finalizing

## Notes

- NEVER download logs — only analyse what's already in LOGFILES/
- Read the project's CLAUDE.md for project-specific log formats, business rules, and false positive lists
- Output goes to `LOGFILES/analyses/`
- For a full weekly rollup (logs + usage + git activity + action items), use the weekly-report skill instead; this skill is the ad-hoc, logs-only entry point.
