---
name: science
description: Hypothesis-driven debugging and investigation - fix the goal first, write down several competing explanations with what would disprove each, then run the cheapest test that tells them apart. Use for bugs with an unknown cause, flaky tests, "why is this happening", performance puzzles, or after two fixes failed. Not for an obvious five-minute fix (hotfix skill) or for analysing a resolved incident (root-cause skill).
---

# Science Skill

Guessing and patching feels fast and is slow. Write the explanations down, then let one test remove several of them at once.

## Steps

### 1. Fix the goal
One sentence, checkable, written before looking at evidence: "The export finishes in under 5 seconds for 10,000 rows" or "Login no longer returns 401 for a valid token". Do not change it while investigating.

### 2. Reproduce
- Get a reproduction that fails on demand: a command, a request, a test.
- No reproduction yet? Then that is the first investigation. Do not read suspect code and guess.
- Note what is known: exact error, when it started, what changed around then (`git log`, deploys, dependency updates, data).

### 3. Write at least three hypotheses
For each: the explanation, and the observation that would **disprove** it.

```
H1: The token is expired before it reaches the API.   Disproved if: the decoded exp is in the future at request time.
H2: The middleware reads the wrong header.            Disproved if: logging shows the header value arrives intact.
H3: Clock difference between the two servers.         Disproved if: both clocks are within one second.
```

A hypothesis that nothing could disprove is not a hypothesis. Include at least one that you think is unlikely: the first idea is often wrong.

### 4. Cheapest discriminating test first
- Pick the test whose result removes the most hypotheses for the least work: a log line, a `curl -i`, a `git bisect`, a SELECT, swapping one input.
- Predict the result per hypothesis **before** running it.
- Change one thing at a time.

### 5. Record and decide
- Per test: what was run, the result, which hypotheses are now out.
- All hypotheses out? Go back to step 3 with what was learned. That is progress, not failure.
- One left and it predicts everything seen? That is the cause. Confirm it by turning the bug on and off.

### 6. Hand over
- Cause found: fix through the **hotfix** skill (or **plan** if it is large), and re-run the reproduction as proof.
- Time box reached without a cause: stop and report what is ruled out, what is left, and the next test. Default time box: 15 minutes for a quick diagnosis.

## Output

```
Goal: [one sentence]
Reproduction: [command or steps]
Hypotheses: [H1..Hn | disproved by | status: out, open or confirmed]
Tests run: [test | result | what it ruled out]
Cause: [one sentence, or "not found"]
Next step: [fix, or the next test]
```

## Hard Rules
- Goal and hypotheses in writing before the first test.
- When the same error survives two fixes, the next move is a fresh diagnosis from step 3. Never a third patch.
- "Inconclusive" is a valid result. Report it as such. Never round it up to "confirmed".
- No fix without the reproduction passing afterwards.
