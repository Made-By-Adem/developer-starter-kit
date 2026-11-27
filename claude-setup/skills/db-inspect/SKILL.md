---
name: db-inspect
description: Read-only database inspection via Supabase MCP - table schemas, RLS policies, views, triggers, indexes, foreign keys, EXPLAIN plans. Use when you need to see the ACTUAL schema before writing SQL or backend code, or when the user asks what a table/policy looks like.
allowed-tools: Read, Grep, Glob, mcp__claude_ai_Supabase__list_projects, mcp__claude_ai_Supabase__list_tables, mcp__claude_ai_Supabase__list_migrations, mcp__claude_ai_Supabase__list_extensions, mcp__claude_ai_Supabase__execute_sql, mcp__claude_ai_Supabase__get_advisors, mcp__claude_ai_Supabase__get_logs, mcp__claude_ai_Supabase__search_docs
---

# DB Inspect Skill

Inspect the live database schema READ-ONLY. Use the Supabase MCP tools (`list_projects`, `list_tables`, `execute_sql`, `list_migrations`).

## HARD RULE — read-only

Only `SELECT` and `EXPLAIN` statements. NEVER execute INSERT, UPDATE, DELETE, TRUNCATE, DROP, ALTER, CREATE, or GRANT through this skill — even if asked mid-inspection. If a change is needed, switch to the **database** skill (which produces a migration file for manual review).

## Steps

1. If multiple Supabase projects exist: `list_projects`, confirm WHICH project with the user before querying.
2. Run the query the task needs (canned queries below).
3. Present results compactly (tables, not raw JSON).

## Canned Queries

**Columns of a table:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<TABLE>'
ORDER BY ordinal_position;
```

**RLS policies on a table:**
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = '<TABLE>';
```

**Is RLS enabled? (all tables):**
```sql
SELECT relname AS table, relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND relkind = 'r'
ORDER BY relrowsecurity, relname;
```

**View definition (e.g. a secure view):**
```sql
SELECT pg_get_viewdef('public.<VIEW>'::regclass, true);
```

**Triggers on a table:**
```sql
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = '<TABLE>';
```

**Indexes on a table:**
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = '<TABLE>';
```

**Foreign keys of a table:**
```sql
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.<TABLE>'::regclass AND contype = 'f';
```

**Query plan (performance):**
```sql
EXPLAIN (ANALYZE false, VERBOSE, COSTS) <THE SELECT QUERY>;
```
Note: only use `ANALYZE true` on SELECTs — it actually executes the query.

**Row counts (approximate, fast):**
```sql
SELECT relname AS table, n_live_tup AS approx_rows
FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 25;
```

## Output Format

```
DB Inspect: [project] / [table or topic]

[compact table of results]

Notes: [anything surprising — missing RLS, type mismatches with code, unused indexes]
```

## Rules
- Production data: never SELECT actual row contents of PII/encrypted tables unless the user explicitly asks; schema and counts are the default.
- Always state which project you queried.
- If a query errors, show the error verbatim — don't guess at schema.
