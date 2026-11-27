---
name: pr
description: Prepare the current branch for a clean pull request - check conflicts against main, review commits, run lint/type checks, generate a grouped PR summary, then push on approval. Use when the user wants to open or prepare a PR.
---

# PR Preparation Skill

Prepare the current branch for a clean pull request.

## Steps

1. **Fetch latest**
   ```bash
   git fetch origin main
   ```

2. **Check for conflicts**
   ```bash
   git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main
   ```
   - If conflicts exist: list them and ask before proceeding
   - Show which files conflict and why

3. **Review all commits on this branch**
   ```bash
   git log origin/main..HEAD --oneline
   git diff origin/main...HEAD --stat
   ```

4. **Run quality checks** (if available in project)
   - Lint: `npx eslint . --ext .js,.vue` or project equivalent
   - Type check if applicable
   - Report any issues found

5. **Check commit messages**
   - Every commit on the branch follows the repo's convention. Without one, use an
     English Conventional Commit `type(scope): subject`
   - If the repo has `commitlint.config.js`, run it:
     ```bash
     npx --yes --package @commitlint/cli --package @commitlint/config-conventional \
       commitlint --from origin/main --to HEAD --verbose
     ```
   - A malformed message is fixed with `git commit --amend` (last commit) or a reword
     rebase, then `git push --force-with-lease` — only after asking. Never add an
     empty commit to "fix" a message or re-run CI.

6. **Generate PR title and body**
   - **Title:** English Conventional Commit `type(scope): subject`. Never the task
     or card title verbatim.
   - **Body**, in English, in this order:
     1. What and why — grouped by layer (database / backend / frontend / config / docs)
     2. `## Deploy note` — every migration the user applies **before** the merge, new
        env vars, deploy impact (in a repo that deploys on merge, a merge to `main`
        is a production deploy). Write `none` when there is nothing.
     3. `## Tests` — what ran and the result
     4. Breaking changes, if any
     5. The issue or ticket this closes, when the branch or task names one
   - If the repo has a create-PR script (`scripts/ci/create-pr.sh`), use it; it builds
     the body itself. If it fails on something outside the change (missing tool,
     infrastructure), fall back to `gh pr create` and add one line to the body saying
     the script was skipped and why.

7. **Present to user**
   ```
   Branch: feat/xxx → main
   Commits: N (commitlint: clean / [issues])
   Files changed: N (+lines / -lines)

   Title: type(scope): subject

   Summary:
   - [grouped changes]

   Deploy note: none / [migrations, env vars, impact]
   Conflicts: None / [list]
   Quality: All clean / [issues]

   Ready to push and create PR?
   ```

8. **On approval**: Push and create the PR with the generated title and body
9. **On feedback**: Address issues first
10. **Wrong title after creation**: `gh pr edit <n> --title "..."`, never a new commit

## Rules

- NEVER force push without explicit user approval
- NEVER push to main/master directly
- NEVER mark a draft PR ready or merge it — both are the user's step
- If there are uncommitted changes, ask whether to commit first
- If branch is behind main, suggest rebase and ask before doing it
