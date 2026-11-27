---
name: property-test
description: Harden existing tests with property-based testing - turn the rule behind a set of example tests into a property, run it on hundreds of generated inputs, shrink any failure to the smallest counterexample. Use for parsers, serializers, validators, money and date maths, permission checks, or when asked "what bugs do my tests miss". Not for writing the first tests of a new feature (test-writer agent) or for UI tests.
---

# Property Test Skill

An example test checks one input. A property test states a rule that holds for **every** input and lets the library search for one that breaks it.

## Steps

### 1. Pick candidates
Good candidates are pure functions with a clear input domain:
- Parsers, serializers, formatters, slug and URL builders
- Validators and sanitizers
- Money, rounding, tax, date and time-zone maths
- Permission and tenant-scope predicates ("may user X see row Y")
- Sorting, paging, merging, de-duplicating

Leave functions with side effects, network calls or no stateable rule to example tests. Do not force a property onto them.

### 2. Check the library
- JavaScript and TypeScript: `fast-check`. Python: `hypothesis`. Other languages: the usual library for that stack.
- If it is not in the project yet, ask before adding it. It is a dev dependency only.

### 3. State the rule
Write the rule in one sentence before writing code. Common shapes:

| Shape | Rule |
|-------|------|
| Round trip | `parse(format(x))` equals `x` |
| Idempotence | `f(f(x))` equals `f(x)` |
| Invariant | The output always has a property: sorted, non-negative, same length, same total |
| Oracle | The fast version equals a slow, obviously correct version |
| Never throws | Any input from the domain returns a result or a defined error |
| Isolation | A row from tenant A is never returned for tenant B, whatever the other inputs are |

### 4. Build generators from the real domain
- Generate what production can actually send: empty strings, null, unicode, very long input, negative and zero amounts, dates around midnight and daylight saving.
- Too narrow a generator finds nothing. A generator that produces impossible input finds false bugs.

### 5. Run and shrink
- Run at least 1000 cases.
- On failure the library shrinks the input to the smallest counterexample. Record that input and the seed.
- Decide: is the code wrong, or was the rule wrong? Say which, with the reason.
- Code wrong: add the counterexample as a normal example test, then fix through the **hotfix** skill.

### 6. Keep the examples
Property tests sharpen example tests. They do not replace them. Delete nothing.

## Output

```
Property tests: [module]
Candidates: [function | rule | shape]
Skipped (no stateable rule): [list or none]
Runs: [count] per property
Failures: [smallest counterexample | seed | code bug or wrong rule]
New example tests added: [list or none]
```

## Hard Rules
- No new dependency without asking.
- A failing property is never "fixed" by narrowing the generator until it passes. Narrow it only when the input is truly impossible in production, and say so.
- Pin the seed of every failure in the test so it reproduces.
