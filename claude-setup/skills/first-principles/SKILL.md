---
name: first-principles
description: Break a problem down to what is really fixed and rebuild the solution from there - sort every "requirement" into hard constraint, soft constraint or untested assumption, then design from the hard ones only. Use when a problem feels stuck, a cost or complexity "cannot be lower", someone says "we can't do X", a design copies how others do it, or when asked to challenge assumptions or think from first principles. Not for debugging (science skill) or for attacking a finished plan (red-team skill).
---

# First Principles Skill

Most design is copying: "how did we do it last time", "what does everyone else use". That inherits other people's assumptions and treats habits as laws. This skill separates what is truly fixed from what is only usual.

## Steps

### 1. Deconstruct
- State what the thing is **for** as an outcome, not as a mechanism: "the cashier sees a new order within two seconds", not "a WebSocket server".
- List every part of the current or proposed solution and every stated requirement.
- For each part: does it serve the outcome, or is it there because it always was?
- If cost is the issue: break the cost into what it is made of (compute, storage, people time, licences) before accepting the total.

### 2. Challenge
Classify every item:

| Type | Meaning | Test | Can change? |
|------|---------|------|-------------|
| **Hard** | Physics, maths, law, a verified fact, a contract that truly binds | Would breaking it be impossible or illegal? | No |
| **Soft** | A choice, a policy, a convention, a habit | Could a decision-maker change it? | Yes |
| **Assumption** | A belief nobody tested | What is the evidence? | Maybe false |

- "Best practice", "industry standard", a market price and "we always do it this way" are soft, not hard.
- Every item marked hard names its evidence. No evidence means it is an assumption.
- For each assumption: the cheapest way to test it.

### 3. Reconstruct
- Start from the outcome and the hard constraints only. Ignore the current form.
- Design the simplest thing that satisfies them. Look at how unrelated fields solve the same outcome.
- Compare it with the current approach: what is gained, what is lost, what it costs to switch.
- Name the single assumption that limited the old solution most.

Each step also works on its own: only challenge a list of constraints, or only rebuild when the hard constraints are already known.

## Output

Short request, short answer: the outcome, the classification and the key insight in a few lines. Use the full form only for a full analysis.

```
Outcome: [what it is for]
Classification:
  Hard: [item | evidence]
  Soft: [item | who could change it]
  Assumption: [item | cheapest test]
Rebuilt solution: [description]
Versus current: [gained | lost | switching cost]
Limiting assumption: [the one that mattered most]
```

## Hard Rules
- Nothing is called hard without evidence.
- The rebuilt solution is a proposal. Building it goes through the **plan** skill.
- A convention that turns out to be soft may still be the right choice. Say so when it is: the goal is a correct picture, not change for its own sake.
