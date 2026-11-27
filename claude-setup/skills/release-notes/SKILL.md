---
name: release-notes
description: Generate a changelog from git history - group commits by type and layer, flag migrations and breaking changes, produce both a technical changelog and a user-facing summary. Use when the user asks for release notes, a changelog, or "what changed since the last release".
---

# Release Notes Skill

Generate release notes from git history. Follow the steps in order.

## Steps

### 1. Determine the range
```bash
git tag --sort=-creatordate | head -5        # recent tags
git log --oneline -1                          # current HEAD
```
- If tags exist: default range is `<last-tag>..HEAD`. State it and ask to confirm.
- If no tags: ask the user for a range (a date `--since=`, a commit, or a branch point like `origin/main..HEAD`).

### 2. Collect the history
```bash
git log <RANGE> --pretty=format:'%h|%ad|%an|%s' --date=short --no-merges
git diff <RANGE> --stat | tail -1
git diff <RANGE> --name-only
```

### 3. Classify every commit
Group into (in this order):
1. **⚠️ Breaking changes** — API signature changes, removed endpoints, renamed columns, changed response formats
2. **🗄️ Database migrations** — any file in the migrations directory. ALWAYS list these explicitly with filenames; deployment depends on it.
3. **✨ Features** — new capabilities
4. **🐛 Fixes** — bug fixes
5. **🔒 Security** — auth, permissions, validation, dependency bumps for CVEs
6. **🧹 Maintenance** — refactors, docs, tooling, dependencies

Base classification on the DIFF content when the commit message is vague — read the changed files, don't guess from the message alone.

### 4. Produce two outputs

**A. Technical changelog** (for the repo / team):
```markdown
# Release [version or date] ([range])

## ⚠️ Breaking Changes
- [change] — migration path: [what deployers must do]

## 🗄️ Migrations (apply BEFORE code deploy)
- `20260701123000_add_x.sql` — [what it does]

## ✨ Features
- [feature] (#commit)
...

Stats: N commits, N files, +X/-Y lines
```

**B. User-facing summary** (for customers/stakeholders):
- Plain language, no file names, no commit hashes
- Only features, fixes users would notice, and anything requiring their action
- Max ~10 bullets

### 5. Deliver
- Show both versions.
- Ask: append to `CHANGELOG.md`? (If the file exists, match its existing format instead of the template above.)

## Rules
- Never invent changes — everything traces to a commit in the range.
- Uncertain classification → put it in Maintenance and mark it `[verify]`.
- Migrations get listed even when the user only asked for a "short" changelog.
