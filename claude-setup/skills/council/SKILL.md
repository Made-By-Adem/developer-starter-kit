---
name: council
description: A short structured debate between four experts with different stances to weigh options and reach a recommendation - visible positions, real disagreement, a verdict that names what is still disputed. Use for "should we use A or B", architecture and tooling choices, trade-off decisions, or when asked for a council, debate or multiple perspectives. Not for attacking one plan (red-team skill) or for looking up facts (research skill).
---

# Council Skill

One viewpoint has one set of blind spots, and a pros-and-cons list has nobody pushing back. Four experts who disagree on the merits expose the weak parts of each option.

## Steps

### 1. Frame the decision
- State the decision as a question with the options named: "Server-sent events or WebSockets for live order updates?"
- Collect the facts every member gets: constraints, numbers, current stack, deadline, what was already tried. Members argue the real decision, not a generic one.

### 2. Brief four members
Write the four briefs before the first round. Each brief: a role, the stance they hold, and what they will push on. Pick roles that fit the topic and that will disagree. A useful default set:

| Seat | Pushes on |
|------|-----------|
| Builder | Speed of delivery, developer experience, what is simplest to build now |
| Operator | Running it at 3 a.m.: failure modes, monitoring, cost, upgrades |
| Security and data skeptic | Tenant isolation, abuse, what leaks when it breaks |
| User advocate | What the end user notices; whether this solves their problem at all |

Swap seats when the topic needs it (for example a database specialist or a finance view).

### 3. Run the rounds
- **Quick (1 round)**: each member gives a position in 30-50 words. Use for a sanity check.
- **Debate (3 rounds, default for a real decision)**:
  1. Opening positions.
  2. Each member answers the strongest point of another member, by name. Agreeing is allowed only with a reason.
  3. Final positions: what changed, what did not, and why.

### 4. Synthesize
- Recommended path, with the main reason.
- The strongest objection still standing.
- What would flip the recommendation.
- Do not force consensus. Remaining disagreement is reported as it is.

## How it runs
- **Inline (default)**: you write all four members yourself in one answer. This is cheap and good enough for most choices. Be honest in the output that it is one model arguing four briefs.
- **With subagents**: only when the user asks for it. Run round 1 as four parallel subagents, each with the facts and only its own brief, then do rounds 2 and 3 inline from their answers. This gives more independent openings and costs far more tokens. Say so before starting.

## Output

```
Decision: [the question]
Facts given to all members: [short list]

Round 1
  [Seat]: [position]
  ...
Round 2
  [Seat] to [Seat]: [response]
  ...
Round 3
  [Seat]: [final position | changed or not]

Recommendation: [path]: [main reason]
Still disputed: [objection]
Would flip if: [condition]
```

## Hard Rules
- Briefs are written before round 1 and not adjusted afterwards to make the debate tidy.
- Members use only the facts supplied or facts verified in this session. No invented benchmarks.
- The user decides. The council recommends.
