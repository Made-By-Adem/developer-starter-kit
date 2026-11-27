---
name: root-cause
description: Structured root cause analysis after a failure - five whys, is/is-not comparison, cause categories, fault tree, blameless postmortem. Use after an incident is resolved, for a bug that keeps coming back, or when asked "why does this keep failing" or "write the postmortem". Not for a production fire that is still burning (incident skill) or a bug with an unknown cause that still needs debugging (science skill).
---

# Root Cause Skill

Find the cause in the system, not a person to blame. The result is a set of actions that prevent the whole class of failure, not only the latest trigger.

## Steps

### 1. Collect the facts
- Timeline with timestamps (state the time zone): what happened, what was noticed, what was done.
- Sources: logs, deploy history, Git history, monitoring, the incident report.
- Read the facts at their source. A hypothesis from the reporter is a hypothesis, not a fact.

### 2. Pick the method

| Situation | Method |
|-----------|--------|
| One clear chain of events | **Five whys**: ask "why" until the answer is a system cause you can change |
| "It fails here but not there" | **Is / is-not**: list where, when and for whom it fails, and where it does not. The cause explains every "is" and predicts no "is-not" |
| Many possible areas | **Cause categories**: code, data, config, infrastructure, process, third party. Collect candidates per category, then test them |
| Several things had to go wrong together | **Fault tree**: start at the failure, branch down with AND / OR until each leaf is checkable |
| Production outage or security incident | **Postmortem**: the full record below, with the other methods as tools |

### 3. Trace to system causes
- Stop at a cause that is both systemic and within your power to change. "Someone forgot" is never the end: ask why the system allowed forgetting.
- Judge decisions by what was known at the time, not by what is known now.
- Ask which safety layers should have caught it (review, tests, types, CI, monitoring, alerts) and why each one did not.
- Read the chain forward once: does each cause really produce the next step? A gap means the chain is not finished.

### 4. Corrective actions
Each action names an owner, and prevents a class of failure. Rate its strength:
- **Strong**: makes the failure impossible (constraint, type, hook, automated check)
- **Medium**: makes it visible fast (alert, test, dashboard)
- **Weak**: relies on memory (documentation, "be more careful")

At least one action should be strong or medium.

## Output

```
Root cause analysis: [title]            Date: YYYY-MM-DD
Impact: [who, what, how long]
Timeline: [time | event | source]
Method: [which and why]
Root causes: [cause | evidence]
Contributing factors: [factor | evidence]
Safety layers that missed it: [layer | why]
Actions: [action | owner | strong, medium or weak]
Open questions: [what the evidence cannot answer]
```

## Hard Rules
- Blameless. Roles, not names.
- Every cause cites its evidence. No evidence means it is listed under open questions.
- Never pad the list with invented factors to look thorough.
- A code fix that follows from the analysis goes to the **hotfix** or **plan** skill.
