---
name: upgrade-deps
description: Safe dependency maintenance - audit vulnerabilities, group outdated packages by risk, upgrade one group at a time with verification, one PR per group. Use when the user asks to update dependencies, fix npm audit findings, or do dependency maintenance.
---

# Upgrade Dependencies Skill

Upgrade dependencies safely, in risk-ordered groups, with verification between groups. Never "update everything and hope".

## Steps

### 1. Inventory
For each package.json in the repo (root + workspaces/subprojects):
```bash
npm audit --omit=dev
npm outdated
```
Also check: is there a lockfile? Which Node version (`.nvmrc`, `engines`)? What verification commands exist (`lint`, `test`, `build` scripts)?

### 2. Group by risk (present this table, then STOP for approval)

| Group | Contents | Risk |
|-------|----------|------|
| A. Security patches | Packages with audit findings, patch/minor bumps | Do first |
| B. Patch updates | `1.2.3 → 1.2.4`, no API changes expected | Low |
| C. Minor updates | `1.2.x → 1.5.x` | Medium — read changelogs |
| D. Major updates | `2.x → 3.x` — breaking changes | High — one package at a time |
| E. Frozen | Packages the project pins deliberately (check CLAUDE.md / comments) | Skip, list why |

**STOP — user picks which groups to do now.**

### 3. Per group: upgrade → verify → commit

For each approved group (A first, then B, C; D one package at a time):

1. Branch if not already on one: `deps/<group>-YYYYMMDD`
2. For majors ONLY: read the changelog/migration guide first; grep the codebase for every API it says changed; report required code changes BEFORE upgrading.
3. Upgrade: `npm install <pkg>@<target>` (exact targets, not `npm update` blanket)
4. Verify — all that exist in the project:
   ```bash
   npm run lint
   npm run test
   npm run build   # ask first if builds are heavy/disallowed (check project CLAUDE.md)
   ```
5. If verification fails: fix if it's a trivial API rename (show the diff), otherwise REVERT that package and record it in the report as blocked.
6. Commit per group with a message listing every bump: `deps: group B patches (foo 1.2.3→1.2.4, bar ...)`

### 4. Smoke test
After all groups: start the app briefly if the project supports it and hit the main flow. A green unit-test run alone does not prove a dependency upgrade is safe.

### 5. Report & PR

```
Dependency update — {DATE}
Vulnerabilities: X fixed, Y remaining (list, with why)
Upgraded: [pkg old→new, per group]
Blocked: [pkg — reason, what's needed]
Frozen (skipped intentionally): [list]
Verification: lint ✅ / tests ✅ (N passed) / build ✅ / smoke ✅
```

Offer the **pr** skill (one PR per group is preferred; one combined PR only if the user asks).

## Hard Rules
- Never upgrade groups C or D in the same commit as A/B — bisectability matters.
- Never silence an audit finding with `npm audit fix --force` — that's a blind major bump.
- Lockfile changes always committed together with package.json.
- A failing verification after an upgrade is a finding to report, never something to "make pass" by loosening config.
