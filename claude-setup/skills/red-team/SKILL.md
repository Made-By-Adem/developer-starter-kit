---
name: red-team
description: Attack a plan, design, architecture or decision to find the flaw that would sink it before reality does - split it into claims, attack the ones everything rests on, rank findings by severity, give a fix for each. Use when asked to "red team this", "poke holes", "play devil's advocate", "what could go wrong", or before committing to a costly plan. Not for weighing several options against each other (council skill) or for security testing of a running system (threat-model skill, security-auditor agent).
---

# Red Team Skill

A list of twenty small remarks is noise. The goal is the one or two flaws that would collapse the plan.

## Steps

### 1. Split into claims
Rewrite the plan as a numbered list of separate claims, including the silent ones: "users want this", "the API can handle the load", "the migration is reversible", "we will have time to finish". Mark which claims the whole plan rests on.

### 2. Attack the load-bearing claims
Use each lens. Skip a lens only when it truly does not apply.

| Lens | Question |
|------|----------|
| Evidence | What proves this claim? Is it measured, or assumed? |
| Failure | What happens when this step fails halfway? Can it be undone? |
| Scale | What happens at 10x the data, users or tenants? |
| Abuse | How would a hostile or careless user misuse this? |
| Dependency | Which outside service, person or deadline can break this? |
| Cost | What does this cost to run, maintain and explain in a year? |
| Simpler way | What is the boring alternative, and why is it not chosen? |
| Second order | What does this change make harder later? |

### 3. Rank
- **Fatal**: the plan fails or causes harm if this is not solved
- **Serious**: it works, but at a clear cost or risk
- **Minor**: worth knowing, does not change the decision

Drop anything below minor. Do not pad.

### 4. Steelman, then verdict
- First write the strongest honest case **for** the plan in 3-5 points. An attack on a weak version of the plan is worthless.
- Then the verdict: proceed, proceed with changes, or reconsider. Name what would change the verdict.

## Depth
- **Inline (default)**: one pass by you, the 4-6 strongest findings.
- **Full**: only when the user asks for it. Run 2-3 subagents in parallel, each with the plan and one group of lenses and no access to each other's reasoning, then merge and rank. More agents give more volume, not more insight: match the number to the number of load-bearing claims. Say that this costs more tokens before starting.

## Output

```
Red team: [subject]
Load-bearing claims: [numbered list]
Findings (worst first):
  [Fatal|Serious|Minor] [title]: breaks claim #[n]. [why, 1-2 sentences]. Fix: [concrete change]
Strongest case for the plan: [3-5 points]
Verdict: [proceed | proceed with changes | reconsider]: [one sentence]. Would change if: [...]
```

## Hard Rules
- Every finding names the claim it breaks and a fix that fits the stated constraints.
- Attack the plan, not the person.
- No invented facts. An attack that rests on something unverified says so, and names how to check it.
- Advice only. This skill changes no files.
