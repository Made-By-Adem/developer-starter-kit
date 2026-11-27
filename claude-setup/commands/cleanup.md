---
description: Delete the local (and remote) branch and its worktree, switch to main and pull, then sweep other merged/stale branches
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git switch:*), Bash(git fetch:*), Bash(git pull:*), Bash(git push:*), Bash(git log:*), Bash(git cherry:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(git worktree:*), Bash(git -C:*), Bash(git for-each-ref:*), Bash(gh pr list:*), Bash(gh pr view:*)
---

The current branch is merged (via PR or directly). Clean it up — including any worktree
attached to it — get back to a fresh main, and sweep up any other leftovers.

This is **best effort**. GitHub usually auto-deletes the remote branch on merge, and often
there is little or nothing left to do. Something that is already gone is a success, not an
error: report it as "already gone" and move on.

Argument (optional): `$ARGUMENTS` — a branch name to clean up instead of the current
branch. If empty, use the branch that is currently checked out.

## Steps

1. **Capture the target branch and the default branch**
   ```bash
   git rev-parse --abbrev-ref HEAD
   git remote show origin | sed -n 's/.*HEAD branch: //p'
   ```
   - Use the real default branch (`main`, `master`, `develop` — do not assume `main`).
   - If the target branch IS the default branch: there is no single branch to clean up.
     Skip steps 2–8 (still make sure the default branch is pulled, step 5) and go to the
     sweep in step 9.
   - If the target branch no longer exists locally or remotely: report it as
     "already gone" and go to step 9.

2. **Find a worktree attached to the branch**
   ```bash
   git worktree list --porcelain
   ```
   - Match the `branch refs/heads/<branch>` entry and note its `worktree` path.
   - No match → skip the worktree handling in steps 3 and 6.
   - If that worktree is the directory I am working in right now (compare against
     `git rev-parse --show-toplevel`): **stop**. A worktree cannot remove itself.
     Report the path and tell me to re-run `/cleanup <branch>` from the main checkout.

3. **Refuse to throw away work**
   ```bash
   git status --porcelain
   ```
   - Uncommitted changes → stop and report. Do not stash, do not discard.
     Let me commit or stash myself, then re-run.
   - If there is a worktree from step 2, check that one too:
     ```bash
     git -C <worktree-path> status --porcelain
     ```
   - Dirty worktree → stop and report the path and the files. Never `--force` it away.

4. **Verify the work is actually in the default branch**
   ```bash
   git fetch origin
   git log origin/<default>..<branch> --oneline
   ```
   - Empty output → fully merged, continue.
   - Commits listed → could still be a squash/rebase merge. Check whether the content
     already landed:
     ```bash
     git cherry origin/<default> <branch>
     ```
     Lines starting with `-` are already upstream; lines starting with `+` are not.
   - Still `+` lines → check for a merged PR (squash merges never show up in `git cherry`
     when the branch had more than one commit):
     ```bash
     gh pr list --state merged --head <branch> --json number,headRefOid,mergedAt
     ```
     A merged PR whose `headRefOid` equals `git rev-parse <branch>` means nothing was added
     after the merge — that counts as verified. Skip this check silently if `gh` is missing
     or not authenticated.
   - Anything left that is genuinely not upstream → **stop and ask** before deleting.
     Show the commits so I can decide.

5. **Switch to the default branch and pull**
   ```bash
   git switch <default>
   git pull --ff-only origin <default>
   ```
   - If `--ff-only` fails, local `<default>` has diverged — report it, don't force anything.
   - If `<default>` is already checked out in another worktree, `git switch` will refuse.
     Stay where I am, run the pull with `git -C <default-worktree-path> pull --ff-only`,
     and say so in the report.

6. **Remove the worktree (if step 2 found one)**
   ```bash
   git worktree remove <worktree-path>
   ```
   - Do this *before* deleting the branch — git refuses to delete a branch that is
     checked out in a worktree.
   - Plain `remove` only. If it refuses because of untracked or modified files,
     stop and report the path; never pass `--force`.
   - Path gone from disk already → `git worktree prune` and report it as "already gone".

7. **Delete the local branch**
   ```bash
   git branch -d <branch>
   ```
   - If `-d` refuses (squash-merged branches look "unmerged" to git) but step 4
     confirmed the content is upstream, use `git branch -D <branch>` and say so in the report.
   - If step 4 could not confirm it, never use `-D`.

8. **Delete the remote branch**
   ```bash
   git push origin --delete <branch>
   ```
   - GitHub often auto-deletes on merge. "remote ref does not exist" is a success,
     not an error — report it as "already gone".
   - Skip entirely if the branch was never pushed (no upstream).

9. **Sweep for other leftovers (best effort)**

   Prune first, so branches that are already gone on the remote stop showing up:
   ```bash
   git fetch --prune origin
   git worktree prune --dry-run --verbose
   git worktree prune
   ```

   Then collect candidates. Never include the default branch, the branch I am on, or any
   branch that has an **open** PR.
   ```bash
   # local branches whose remote branch is gone (typically auto-deleted on merge)
   git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads | grep '\[gone\]'
   # local and remote branches whose commits are all in the default branch
   git branch --merged origin/<default> --format='%(refname:short)'
   git branch -r --merged origin/<default> --format='%(refname:short)'
   # squash-merged branches: merged PRs, to compare against branch tips
   gh pr list --state merged --limit 100 --json number,headRefName,headRefOid
   gh pr list --state open --limit 100 --json number,headRefName
   ```
   A candidate only qualifies when its merge is verified, using the same test as step 4:
   `--merged`, `git cherry` without `+` lines, or a merged PR whose `headRefOid` equals the
   branch tip (local: `git rev-parse <branch>`, remote: `git rev-parse origin/<branch>`).
   A `[gone]` upstream alone is **not** proof — a branch can be deleted without being merged.
   Candidates that fail verification are listed as "skipped — not verified", never deleted.

   For each qualifying local branch with a worktree attached: apply the checks of
   steps 2–3 (not the directory I am in, clean `git status`). Locked worktrees
   (`locked` in `git worktree list --porcelain`) are skipped and reported.

   - Nothing found → report "Sweep: nothing left to clean up" and finish. That is the
     normal outcome when auto-delete on merge already did the work.
   - Something found → show the list once (branch, where it lives, how the merge was
     verified) and ask for one confirmation for the whole list. On yes, per candidate:
     `git worktree remove <path>` (plain, no `--force`) → `git branch -d` (or `-D` only when
     verified via cherry/PR) → `git push origin --delete <branch>` for remote candidates.
     "remote ref does not exist" is "already gone". One failure does not stop the rest.

## Report

Short and factual:

```
Branch:   <branch> / (on default branch — skipped)
Worktree: removed <path> / none
Local:    deleted / already gone
Remote:   deleted / already gone / never pushed
Now on:   <default> @ <short sha> — <n> new commits pulled
Sweep:    nothing left to clean up
          / deleted: <branch> (local+remote, merged PR #n), <branch> (local, [gone] + merged)
          / skipped: <branch> — not verified / open PR / locked worktree / dirty worktree
Pruned:   <n> stale worktree entries, <n> stale remote-tracking refs
```

## Rules

- Never delete a branch whose merge you could not verify — ask instead.
- Never discard uncommitted or unpushed work; stop and report.
- No force-push, no `git reset --hard`, no stashing on my behalf.
- Remove a worktree only when it is clean and only with plain `git worktree remove` —
  no `--force`, ever. A dirty worktree means stop and report.
- Never remove the worktree I am currently standing in.
- Never touch a branch with an open PR, even if it looks merged.
- Things that are already gone are fine — best effort, not an error.
