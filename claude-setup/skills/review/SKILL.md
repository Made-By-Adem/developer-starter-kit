---
name: review
description: Project-specific self-review checklist (type mismatches, namespace resolution, null/empty handling, permissions completeness, encryption, Vue template validity). Run after writing code and BEFORE presenting changes to the user.
---

# Review Skill

Run a self-review on all code changes before presenting them to the user.

## Self-Review Checklist

Go through each item. If an item doesn't apply, skip it. If it fails, fix it before presenting.

### 1. Type Mismatches
- Read the actual database schema/migrations for any referenced tables
- Verify column types match exactly (uuid vs varchar vs text, name[] vs text[], etc.)
- Verify foreign key types match their referenced primary keys

### 2. Namespace Resolution
- Grep the codebase for how namespace_id is derived in similar code
- NEVER assume namespace_id from a related entity — trace the actual pattern
- Verify RLS policies use the correct namespace_id source

### 3. Empty/Null Edge Cases
- All new validations handle BOTH null AND empty string
- Default values are appropriate

### 4. Sort Direction
- Explicitly verify sort order matches user intent
- Don't silently default to ascending

### 5. Property/Field Names
- Grep codebase to verify exact property names before using them
- Check both database column names AND JavaScript object keys

### 6. Vue Template Structure
- No illegal nesting (e.g., no `<div>` inside `<tbody>` without `<tr>`)
- Components properly imported and registered
- Reactive refs accessed correctly in template vs script

### 7. Permissions Completeness
- For any new route: middleware auth check exists
- For any new page: frontend navigation guard exists
- For any new table/query: RLS policy exists
- All three match

### 8. Project-specific checks
Read the "Review checklist" / domain-critical sections of the project's CLAUDE.md and apply any additional checks defined there (e.g. encryption round-trips, offline flows, payment flows, i18n completeness, multi-tenant scoping).

### 9. Same mistake elsewhere
- For every defect fixed in this change: one grep for the same pattern in the rest of the codebase
- List the other places found. Fix them only when they are inside the scope of the task; otherwise report them

### 10. Proof for every claim
- Every "works", "fixed" or "done" in the summary has proof from this session that fits the claim: endpoint → `curl -i`; schema or data → SELECT; page → browser; config → read back; logic → a test that ran
- Reading the code is not proof. A claim without proof is reworded to "not verified", with the reason

### 11. Everything that was asked
- List every explicit request from the user in this task
- Mark each one: done, skipped (with the reason), or needs the user's decision. Nothing disappears silently

## Output

After review, present a brief summary:
```
Review complete:
- [x] Types verified against schema
- [x] Namespace resolution traced
- [x] Null/empty handled
- [N/A] Sort direction (no sorting)
- [x] Property names grepped
- ...
```

Then present the code changes.

## Rules

- If ANY critical item fails, fix it BEFORE presenting
- Don't skip items — explicitly mark N/A if not applicable
- This review replaces the need for the user to catch these issues manually
