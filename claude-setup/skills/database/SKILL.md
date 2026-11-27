---
name: database
description: Rules for writing SQL migrations, RLS policies, secure views, triggers, and encrypted columns. Use for ANY schema change - new tables, ALTER statements, indexes, policies - before writing a single line of SQL.
---

# Database Skill

You are now working on database changes. Follow these rules strictly.

## Before Writing ANY SQL

1. **Read existing schema first** — ALWAYS
   - Read the migration files for affected tables
   - Note exact column types (uuid vs varchar vs text, name[] vs text[], etc.)
   - Note existing RLS policies and their type casts
   - Note existing secure views and INSTEAD OF triggers (if applicable)

2. **Check project CLAUDE.md** for database conventions, encryption requirements, and migration templates

3. **Identify what's needed**
   - New table? → Table + RLS + secure view + triggers + indexes
   - Alter table? → Read current schema first, include rollback
   - New RLS policy? → Read existing policies, check for duplicates/orphans
   - New encrypted column? → Update table + secure view + INSERT trigger + UPDATE trigger

## Migration Rules

### Structure
Every migration file must include:
1. **UP migration** — the actual changes
2. **DOWN migration** — exact SQL to reverse (unless told otherwise)
3. **Verification block** — comments showing how to verify the migration worked

### New Tables Must Have
- [ ] RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] `service_role` bypass policy
- [ ] Namespace-scoped policies using `namespace_id`
- [ ] Soft delete columns: `deleted_at TIMESTAMPTZ`, `deleted_by_user_id UUID`
- [ ] Audit columns: `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id`
- [ ] Appropriate indexes (including soft-delete aware: `WHERE deleted_at IS NULL`)

### Encryption (if project uses pgsodium)
- [ ] New business columns: `column_encrypted BYTEA` in table
- [ ] Secure view: `decrypt_to_text()` for reading
- [ ] INSERT trigger: `encrypt_from_text()` for new columns
- [ ] UPDATE trigger: `encrypt_from_text()` for new columns
- [ ] DELETE trigger: soft delete (set `deleted_at`, not hard delete)
- [ ] Grants: `SELECT, INSERT, UPDATE, DELETE` to `authenticated`, `ALL` to `service_role`
- [ ] Correct encryption key for data type

### Type Safety
- Verify foreign key columns match referenced primary key types exactly
- Verify RLS policy type casts match actual column types
- Verify default values match column types
- Use `uuid` for IDs, `timestamptz` for timestamps

## RLS Policy Checklist
- [ ] No cross-tenant access possible
- [ ] service_role can bypass (for cron jobs, admin operations)
- [ ] Namespace admin/manager scoped correctly
- [ ] No orphaned policies from previous migrations
- [ ] No duplicate policies that conflict

## Do NOT
- Apply migrations automatically — create the SQL file, then STOP
- Guess column types — read the actual schema
- Write policies without checking existing ones for conflicts
- Hard delete data — use soft delete pattern
- Skip rollback SQL

## Output Format

Present the migration with:
```
Migration: YYYYMMDDHHMMSS_description.sql
Risk level: LOW / MEDIUM / HIGH / CRITICAL
Tables affected: [list]
Rollback: [included / not included + reason]

[SQL content]

Verification:
- [How to verify it worked]
```

Wait for user approval before proceeding.
