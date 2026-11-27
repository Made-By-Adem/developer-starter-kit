---
description: Find the project's deploy script, map the files changed in the current PR to its item numbers, and suggest the quick-deploy selection (e.g. items 4,6,7). Learns the setup per project.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git fetch:*), Bash(git rev-parse:*), Bash(git ls-files:*), Bash(git ls-tree:*), Bash(git merge-base:*), Bash(git hash-object:*), Bash(git remote:*), Bash(git branch:*), Bash(git -C:*), Bash(gh pr view:*), Bash(gh pr list:*)
---

Tell me which items of the deploy script I need for the work in the current PR — for
example `Items: 4,6,7` — so I can run a quick deploy of just those. **Suggest only: never
run the deploy.**

Argument (optional): `$ARGUMENTS` — a PR number or branch name. If empty, use the PR of
the branch that is currently checked out, or the diff against the default branch when
there is no PR.

## The project profile (this is how it learns)

Every project gets a profile at `<main-checkout>/.claude/deploy-option.md`. It records what
was found the first time, so later runs skip the search.

- `<main-checkout>` is the primary checkout, not a worktree — worktrees get removed after
  merge and would take the profile with them:
  ```bash
  dirname "$(git rev-parse --path-format=absolute --git-common-dir)"
  ```
- Profile present → use it, but **verify it is still true** (step 2). Profile missing →
  discover (step 1), then write it.
- When I correct you ("item 12 is also needed when …", "that script is not for deploys"),
  add it to the profile's `Notes` so the next run knows.
- Don't commit the profile; mention it in the report when it is new or changed.

Profile format:

```markdown
# Deploy options profile
Maintained by /deploy-option. Edit freely — every run re-verifies it.
Last verified: YYYY-MM-DD

## Target: <name, e.g. api-server>
- Deploy root: `<path relative to repo root, e.g. api-server/>`
- Scripts:
  - `<path>` (bash) — fingerprint `<git hash-object output>`
  - `<path>` (PowerShell) — fingerprint `<…>` — same numbering as the bash script: yes/no
- Quick syntax: `./deploy.sh --quick <n,n>` · `.\DeployToServer.ps1 -Quick <n,n>`
- Dry run: `--dry-run` · `-DryRun`
- Item list: hardcoded (`ITEM_NAMES` in deploy.sh, `$items` in the .ps1)
  / derived from the directory (folders first, then files, each alphabetical, minus excludes)
- Never uploaded: node_modules, .git, logs, .env, …
- Items (hardcoded lists only):
  | # | Type | Name |
  |---|------|------|
  | 1 | Folder | config |

## Notes
- <learned facts, corrections from me, quirks — e.g. "scp merges: deleted files stay on the host">
```

## Steps

1. **Discover (only when there is no profile, or step 2 invalidated it)**
   - Read the project `CLAUDE.md` / `AGENTS.md` for a deployment section, and look for
     project skills that mention deploying (`.claude/skills/*deploy*`).
   - Search tracked files for deploy scripts:
     ```bash
     git ls-files | grep -iE '(^|/)(deploy[^/]*|deploytoservers?|deploymentscript)\.(sh|ps1|mjs|js|py)$'
     ```
     Typical places: `*-server/`, `*-server/deploy/`, `scripts/`, `tools/`, `deploy/`.
     If nothing is tracked, also check untracked files the same way (`git ls-files --others --exclude-standard`).
   - Read each candidate. It is an item-based deploy script when it has **a numbered item
     list plus an option to pick items** (`--quick 3,7`, `-Quick 3,7`, `--items`, …).
     Cleanup/helper scripts (e.g. "delete-cloudflare-deployments") are not.
   - From the script, work out: deploy root (what directory gets uploaded — often the
     script's parent or the directory above `deploy/`), the item list and how it is built,
     the exclude list, the quick and dry-run syntax.
   - A `.sh` and a `.ps1` for the same root: compare their item tables and record whether
     the numbering matches. If it does not, say so loudly and give both selections.
   - Several deploy roots (e.g. `api-server` and `webapp`) → one `Target` section each.
   - Genuinely ambiguous (two scripts for the same root, unclear which is current) → ask me
     once, record the answer.
   - No item-based script at all → say so and stop. Don't write a profile for that.

2. **Verify the profile**
   - Every script path still exists, and `git hash-object <script>` still matches the
     recorded fingerprint. A changed script → re-read it and update the profile (the item
     table, syntax, excludes) before using it. Say that it was updated.
   - Missing script → rediscover (step 1).
   - Derived item lists: never trust stored numbers — rebuild the list from the deploy root
     at the commit you are deploying (step 3), using the script's rule.
     `git ls-tree --name-only <ref> <deploy-root>/` gives the top level. You may run the
     script's own `--list` only when reading it confirms that flag exits before loading
     config or touching the network.

3. **Determine the change set**
   ```bash
   git fetch origin
   gh pr view $ARGUMENTS --json number,title,baseRefName,headRefName,headRefOid
   ```
   - PR found → diff `git diff --name-status -M origin/<base>...<head>` where `<head>` is
     the local branch when it is checked out, otherwise `origin/<headRefName>`.
   - No PR (or `gh` unavailable) → diff against the default branch:
     `git diff --name-status -M origin/<default>...HEAD`.
   - The deploy scripts upload the **local working tree**, not the commit. So also run
     `git status --porcelain`, and list uncommitted changes under the deploy root separately.
     If the checked-out branch is not the PR branch, warn: deploying now would upload
     whatever is checked out, not the PR.

4. **Map changed files to items**
   For each changed path under a target's deploy root, strip the root; the first path
   segment is the item name (a folder), or the whole remainder when it is a file at the
   root. Look it up in the item list.
   - Renames (`R`) count for both the old and the new path.
   - Deleted files (`D`) still select their item, and go on the watch-out list: copying
     a folder does not delete files on the host.
   - Matches an exclude (`.env`, `node_modules`, `logs`, `deploy/`, `TEST`, …) or is a
     dotfile → "not deployed by design".
   - In no item and not excluded (e.g. a new top-level folder the hardcoded table does not
     know yet) → **watch out**: the quick deploy cannot ship it; the script's table needs
     the new entry (in both scripts when there are two).
   - `package.json` / lockfile changed → note that dependencies need installing on the host,
     if the script does not do that itself.
   - Also scan the rest of the diff and mention, without mapping: database migrations
     (`supabase/migrations/`, `*-database/`, `*.sql`) → they must be **applied manually
     before** the code deploy; changed `.env.example` / `deploy.env.example` → new
     variables may be needed on the host; changed paths outside every deploy root (e.g. the
     webapp) → not covered by these scripts.

5. **Save the profile** (new, or updated in step 2), with today's date as `Last verified`.

## Report

```
Deploy options — PR #<n> <head> → <base>   (or: <branch> vs <default>, no PR)

<target>  (<script path>)
  Items: 3,7,9
    3  controllers   ← 4 files
    7  routes        ← 2 files (1 deleted)
    9  services      ← 1 file
  Dry run:  cd <dir> && ./deploy.sh --quick 3,7,9 --dry-run
  Deploy:   cd <dir> && ./deploy.sh --quick 3,7,9
            .\DeployToServer.ps1 -Quick 3,7,9          (same numbering)
  Watch out:
    - deleted in this PR, stays on the host: routes/oldRoute.js
    - not deployable via quick: lib/ (new folder, not in the item table)
    - uncommitted, would be uploaded too: services/foo.js

Also in this PR
  - migrations: supabase/migrations/2026…_x.sql → apply manually BEFORE deploying
  - outside the deploy scripts: webapp/ (12 files)

Profile: <main-checkout>/.claude/deploy-option.md — created / used (still valid) / updated (<why>)
```

No changes under any deploy root → say "Nothing to deploy for <target>" instead of an
empty item list.

## Rules

- Never run the deploy script (the only exception is a verified read-only `--list`), never
  ssh/scp, never restart anything. This command suggests; I deploy.
- Never print values from `deploy.env` or other config files with secrets — paths and
  variable names only.
- Never apply migrations. Mention them, with the reminder that they go first.
- Item numbers come from the script as it is now — re-verify, don't trust memory.
- Don't commit the profile or any other file.
