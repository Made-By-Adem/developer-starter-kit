---
name: data-fix
description: Safe production data corrections - SELECT the affected rows first, show count and sample, produce a guarded UPDATE/soft-delete script with rollback for the user to apply manually. Use when production data is wrong and needs correcting (never for schema changes - that is the database skill).
allowed-tools: Read, Grep, Glob, Write, mcp__claude_ai_Supabase__list_tables, mcp__claude_ai_Supabase__execute_sql
---

# Data Fix Skill

Correct wrong DATA in production (not schema — that's the **database** skill). This skill produces a verified script; the USER applies it. You never execute data mutations.

## Steps

### 1. Define the defect precisely
Write down before querying:
```
Wrong: [what is wrong, e.g. "orders from shop X on July 1 have status 'pending' but were paid"]
Should be: [correct state]
Cause: [why it happened — link incident/bug if known]
Scope guess: [~how many rows, which namespaces]
```

### 2. SELECT first — always
Use **db-inspect** (read-only) to find the EXACT affected rows:
```sql
SELECT id, namespace_id, <relevant columns>, updated_at
FROM <secure view if the table is encrypted — never the raw table>
WHERE <precise conditions identifying ONLY the broken rows>;
```
- Show the user: **row count** + **first 5 rows**.
- If the count differs wildly from the scope guess: **STOP** — the WHERE clause is wrong or the problem is different than assumed.
- **STOP — user must confirm these are exactly the right rows.**

### 3. Write the fix script
Produce one SQL file (like a migration: `datafix_YYYYMMDDHHMMSS_description.sql`) containing:

```sql
-- DATA FIX: [description]
-- Expected affected rows: [N from step 2]

-- 1. SAFETY SNAPSHOT of affected rows
CREATE TABLE IF NOT EXISTS _datafix_backup_YYYYMMDD_description AS
SELECT * FROM <table> WHERE <same conditions>;

-- 2. THE FIX — inside a transaction with a row-count guard
BEGIN;
UPDATE <secure view or table>
SET <corrections>, updated_at = now()
WHERE <same precise conditions>;
-- VERIFY before commit: row count MUST equal [N]:
--   run: SELECT count(*) FROM ... (re-check conditions now match 0 broken rows)
-- If count is wrong: ROLLBACK;
COMMIT;

-- 3. ROLLBACK (if the fix turns out wrong later)
-- UPDATE <table> t SET <columns> = b.<columns> FROM _datafix_backup_... b WHERE t.id = b.id;

-- 4. CLEANUP (only after fix is confirmed good, days later)
-- DROP TABLE _datafix_backup_YYYYMMDD_description;
```

Adapt to the project's patterns: encrypted tables → go through the secure view so triggers handle encryption; deletions → SOFT delete (`deleted_at = now()`), never hard DELETE.

### 4. Present and stop
```
Data fix: [title]
Rows affected: N (verified by SELECT)
Namespaces touched: [list]
Backup: _datafix_backup_... (created by the script itself)
Rollback: included
```
**The user applies the script manually. You are done after presenting it.**

### 5. After the user applies it
- Re-run the step 2 SELECT via db-inspect: broken-row count must now be 0.
- Remind about the follow-up: fix the CODE that corrupted the data (hotfix/feature), otherwise the fix is temporary.

## Hard Rules
- NEVER execute UPDATE/DELETE/INSERT yourself — not through MCP, not through anything. Present the script only.
- No fix without a snapshot table and a written rollback.
- WHERE conditions must be exact — a data fix that touches one row too many is an incident.
- Multi-namespace fixes: list every affected namespace explicitly before presenting.
