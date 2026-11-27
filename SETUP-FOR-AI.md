# Setup instructions for an AI assistant

**For people:** open Claude Code in this folder and say **"set up my dev environment"**.
Claude then follows the steps below. You do not need to read the rest.

**For Claude:** follow this file when the user asks to set up, install or update their
development environment from this repository. The user may have little technical
knowledge. Explain each step in one or two plain sentences before you do it.

---

## Rules for this job

1. **Ask before you install or change anything on the computer.** One question per group
   of changes is enough (tools, Claude setup, VS Code, extras). Reading and checking need
   no permission.
2. **Never overwrite or delete a file the user already has.** When something exists and
   differs, keep theirs, tell them, and offer to merge it together.
3. **Back up before you edit** any existing settings file.
4. **Never ask for, print or store passwords, tokens or keys.** Logins (GitHub, Claude,
   Cloudflare, Supabase) are done by the user in their own browser.
5. **Do not use `sudo` or an administrator prompt on your own.** If a step needs it, give
   the user the exact command to run themselves.
6. **Report honestly.** A step that failed or was skipped is listed as failed or skipped.
7. Work through the steps in order. A step that is already done is skipped, not repeated.

---

## Step 1: Look at what is already there

Find the operating system, then check each tool. Run the checks, do not guess.

| Tool | Check | Needed for |
|------|-------|-----------|
| Node.js (LTS, version 22 or newer) | `node --version` | Everything: projects, hooks, the status line |
| Git | `git --version` | Saving work; on Windows it also provides `bash` |
| bash | `bash --version` | The status line |
| VS Code | `code --version` | The editor |
| Python 3 | `python3 --version` (Windows: `python --version`) | Optional: Python projects and the design skills |
| GitHub CLI | `gh --version` | Optional: pull requests from the terminal |
| Supabase CLI | `supabase --version` | Optional: only for projects that use Supabase |

Also check:

- the Claude config folder: `~/.claude` (Windows: `C:\Users\<name>\.claude`), or the
  folder in `CLAUDE_CONFIG_DIR` when that is set. Does it exist, and what is in it?
- the VS Code extension: `code --list-extensions` contains `anthropic.claude-code`?

Show the user a short table: what is present, what is missing, what is optional.

## Step 2: Install the missing tools

Only what is missing, and only after the user agrees. Use the package manager that is
already on the computer. If there is none, send the user to the official download page
instead of installing a package manager for them.

| Tool | Mac (Homebrew) | Windows (winget) | Linux | Download page |
|------|----------------|------------------|-------|---------------|
| Node.js | `brew install node` | `winget install OpenJS.NodeJS.LTS` | the distribution's package manager or nvm | https://nodejs.org |
| Git | `brew install git` | `winget install Git.Git` | package manager | https://git-scm.com |
| VS Code | `brew install --cask visual-studio-code` | `winget install Microsoft.VisualStudioCode` | package manager | https://code.visualstudio.com |
| Python 3 | `brew install python` | `winget install Python.Python.3.13` | package manager | https://python.org |
| GitHub CLI | `brew install gh` | `winget install GitHub.cli` | package manager | https://cli.github.com |
| Supabase CLI | `brew install supabase/tap/supabase` | Scoop, or per project with `npm install -D supabase` | per project with `npm install -D supabase` | https://supabase.com/docs/guides/cli |

Notes:

- After an install, a new terminal is often needed before the command is found. Check
  again; if it is still missing, ask the user to restart the terminal or VS Code and
  continue from this step.
- On a Mac, if `code` is missing but VS Code is installed: in VS Code open the Command
  Palette and run "Shell Command: Install 'code' command in PATH".
- Wrangler (Cloudflare) needs no install. Projects use it through `npx wrangler`.
- Do not set Git's name and email yourself. Ask the user for them and run
  `git config --global user.name` / `user.email` only if they are not set.

## Step 3: Install the Claude setup

What gets installed is described in [`claude-setup/README.md`](claude-setup/README.md).

1. Show what would happen, without changing anything:

   ```bash
   node claude-setup/install.mjs --dry-run
   ```

2. Explain the output to the user in plain words and ask if you may continue.
3. Install:

   ```bash
   node claude-setup/install.mjs
   ```

The installer copies agents, skills, commands, hooks, boilerplates, references and the
status line into the Claude config folder. It skips every file that already exists, and
it merges `settings.json` after making a backup in `backups/` inside that folder.

Then handle what the installer reports:

- **"Kept yours" files.** These exist already and differ from the kit. Leave them. For
  `CLAUDE.md`, offer to show the differences with `claude-setup/CLAUDE.md` and to add the
  parts the user wants. Change it only after they agree.
- **"statusLine: kept yours".** The user already has a status line. Ask if they want to
  switch to the kit's one. If yes, set `statusLine` in `settings.json` to the value from
  `claude-setup/settings.json`.
- **"settings.json is not valid JSON".** Show the user where the error is and offer to
  fix it. Then run the installer again.

Running the installer again later is safe. It only adds what is missing.

### Windows

The hooks and the status line are started as `node "$HOME/.claude/..."` and
`bash "$HOME/.claude/..."`. That works when Claude Code runs its commands through Git
Bash, which is the normal case. If the check in step 6 shows they do not run, replace
`$HOME/.claude` in `settings.json` with the full path, written with forward slashes
(for example `C:/Users/<name>/.claude`).

## Step 4: VS Code

1. Install the Claude Code extension if it is missing:

   ```bash
   code --install-extension anthropic.claude-code
   ```

2. Offer these optional extensions and install the ones the user picks:
   `Vue.volar` (Vue), `bradlc.vscode-tailwindcss` (Tailwind CSS),
   `esbenp.prettier-vscode` (formatting), `humao.rest-client` (try out API calls).

3. Add the settings from `claude-setup/vscode-settings.json` to the user's VS Code
   settings file:

   | System | File |
   |--------|------|
   | Mac | `~/Library/Application Support/Code/User/settings.json` |
   | Windows | `%APPDATA%\Code\User\settings.json` |
   | Linux | `~/.config/Code/User/settings.json` |

   - This file may contain comments and trailing commas. Do not parse and rewrite it
     with a JSON tool; that destroys the comments. Make a backup copy, then add only the
     missing keys with a precise edit. If the file does not exist, create it.
   - A key that already exists keeps the user's value.
   - Tell the user what `"claudeCode.initialPermissionMode": "acceptEdits"` means: Claude
     may edit files in the project without asking each time. It still asks before
     running commands. If they prefer to approve every edit, leave that key out.

## Step 5: Optional extras

`claude-setup/README.md` has a table "Optional extras (made by others)". Ask the user
which ones they want (none is a fine answer), and install only those, from their own
source. Say that these are made by other people and have their own licence.

Two more things the user can switch on themselves. Explain them, do not do them:

- **Supabase connector** for Claude: lets Claude look at the database structure. Useful
  only for projects that use Supabase.
- **Claude in Chrome** extension: lets `/e2e-test` test in the user's own browser.

## Step 6: Check that it works

Run these and compare with the expected result. Use the real config folder path.

```bash
# 1. The files are there
ls ~/.claude/agents ~/.claude/skills ~/.claude/commands ~/.claude/hooks

# 2. A hook lets a harmless command through (expected: exit code 0)
echo '{"tool_input":{"command":"ls"}}' | node ~/.claude/hooks/block-migration-apply.cjs; echo $?

# 3. The same hook blocks a force-push (expected: a "BLOCKED" message and exit code 2)
echo '{"tool_input":{"command":"git push --force"}}' | node ~/.claude/hooks/block-migration-apply.cjs; echo $?

# 4. The status line prints two lines (expected: a line starting with "Claude")
echo '{}' | bash ~/.claude/statusline.sh

# 5. settings.json is valid JSON
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('ok')" ~/.claude/settings.json
```

Settings, hooks, agents and the status line are loaded when Claude Code starts. Ask the
user to **close and reopen Claude Code** (or VS Code), and to check that:

- a status line with the model name and a context bar is visible;
- `/agents` lists agents such as `planner` and `code-reviewer`;
- typing `/` shows commands such as `/stack-up` and `/cleanup`.

## Step 7: Report

End with a short summary in plain language:

```
Your dev environment
  Tools:        Node 24 ✓ · Git ✓ · VS Code ✓ · Python (skipped, optional)
  Claude setup: 379 files added · 2 kept as they were (list) · settings merged, backup at <path>
  VS Code:      Claude Code extension ✓ · 4 settings added
  Extras:       none chosen
  Still to do:  restart Claude Code · log in to GitHub with `gh auth login` (optional)
  Not done:     <anything that failed or was skipped, and why>
```

Then tell them the next step: make an empty folder, copy `CLAUDE.md` from this
repository into it, open Claude Code there and describe what they want to build.
[`guides/STACK-GUIDE.md`](guides/STACK-GUIDE.md) helps them choose a setup.

---

## Undo

Everything lives in the Claude config folder. To go back:

- `settings.json`: copy the newest file from `backups/` back over it.
- Files: delete the ones the installer added. Its output listed them per folder. Never
  delete a folder as a whole; the user may have their own files in it.
- VS Code: restore the backup copy of the settings file and uninstall the extension with
  `code --uninstall-extension anthropic.claude-code`.

Ask the user before each of these.
