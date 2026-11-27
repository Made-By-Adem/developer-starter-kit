#!/usr/bin/env node
// Installs the starter kit's Claude Code setup into your Claude config folder
// (~/.claude, or CLAUDE_CONFIG_DIR when that is set).
//
//   node claude-setup/install.mjs            install
//   node claude-setup/install.mjs --dry-run  show what would happen, change nothing
//
// It never overwrites a file you already have. settings.json is merged: your own
// values stay, missing entries are added, and a backup is made first.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
const setupDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(setupDir);
const target = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

const report = { added: [], same: 0, kept: [], settings: [] };

const listFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.DS_Store' || entry.name === 'node_modules' || entry.name === '__pycache__') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });

const copyFile = (from, to) => {
  const shown = path.relative(target, to);
  if (fs.existsSync(to)) {
    if (fs.readFileSync(from).equals(fs.readFileSync(to))) report.same += 1;
    else report.kept.push(shown);
    return;
  }
  report.added.push(shown);
  if (dryRun) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  for (const file of listFiles(from)) copyFile(file, path.join(to, path.relative(from, file)));
};

// ---------- Files ----------

copyDir(path.join(repoDir, '.claude', 'agents'), path.join(target, 'agents'));
copyDir(path.join(repoDir, '.claude', 'boilerplates'), path.join(target, 'boilerplates'));
copyDir(path.join(repoDir, '.claude', 'references'), path.join(target, 'references'));
copyDir(path.join(repoDir, '.claude', 'skills'), path.join(target, 'skills'));
copyDir(path.join(setupDir, 'skills'), path.join(target, 'skills'));
copyDir(path.join(setupDir, 'commands'), path.join(target, 'commands'));
copyDir(path.join(setupDir, 'hooks'), path.join(target, 'hooks'));
copyFile(path.join(setupDir, 'statusline.sh'), path.join(target, 'statusline.sh'));
copyFile(path.join(setupDir, 'CLAUDE.md'), path.join(target, 'CLAUDE.md'));

// ---------- settings.json (merge) ----------

const settingsPath = path.join(target, 'settings.json');
// The template points at $HOME/.claude. With another config folder, point at that instead.
let template = fs.readFileSync(path.join(setupDir, 'settings.json'), 'utf8');
if (process.env.CLAUDE_CONFIG_DIR) {
  template = template.replaceAll('$HOME/.claude', target.replaceAll('\\', '/'));
}
const ours = JSON.parse(template);
let theirs = {};
let settingsReadable = true;
if (fs.existsSync(settingsPath)) {
  try {
    theirs = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    settingsReadable = false;
    report.settings.push('NOT CHANGED: your settings.json is not valid JSON. Fix it and run this again.');
  }
}

if (settingsReadable) {
  const merged = structuredClone(theirs);

  merged.permissions ??= {};
  for (const list of ['allow', 'deny', 'ask']) {
    const current = merged.permissions[list] ?? [];
    const missing = (ours.permissions[list] ?? []).filter((rule) => !current.includes(rule));
    if (missing.length) {
      merged.permissions[list] = [...current, ...missing];
      report.settings.push(`permissions.${list}: added ${missing.length} rule(s)`);
    }
  }

  merged.hooks ??= {};
  for (const [event, groups] of Object.entries(ours.hooks)) {
    const existing = JSON.stringify(merged.hooks[event] ?? []);
    for (const group of groups) {
      // A hook counts as installed when its script name already appears for this event.
      const missing = group.hooks.filter((hook) => !existing.includes(path.basename(hook.command.split('"')[1])));
      if (missing.length) {
        merged.hooks[event] = [...(merged.hooks[event] ?? []), { ...group, hooks: missing }];
        report.settings.push(`hooks.${event}: added ${missing.length} hook(s)`);
      }
    }
  }

  if (!merged.statusLine) {
    merged.statusLine = ours.statusLine;
    report.settings.push('statusLine: set');
  } else if (JSON.stringify(merged.statusLine) !== JSON.stringify(ours.statusLine)) {
    report.settings.push('statusLine: kept yours (the kit\'s status line is installed as statusline.sh but not switched on)');
  }

  const changed = JSON.stringify(merged) !== JSON.stringify(theirs);
  if (changed && !dryRun) {
    fs.mkdirSync(target, { recursive: true });
    if (fs.existsSync(settingsPath)) {
      const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
      const backup = path.join(target, 'backups', `settings-${stamp}.json`);
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(settingsPath, backup);
      report.settings.push(`backup of your old settings: ${backup}`);
    }
    fs.writeFileSync(settingsPath, `${JSON.stringify(merged, null, 2)}\n`);
  }
  if (!changed) report.settings.push('already up to date');
}

// ---------- Report ----------

console.log(`${dryRun ? 'DRY RUN, nothing was changed.\n' : ''}Claude config folder: ${target}\n`);
console.log(`${dryRun ? 'Would add' : 'Added'}: ${report.added.length} file(s)`);
const perFolder = {};
for (const file of report.added) {
  const folder = file.includes(path.sep) ? file.split(path.sep)[0] : file;
  perFolder[folder] = (perFolder[folder] ?? 0) + 1;
}
for (const [folder, count] of Object.entries(perFolder)) console.log(`  ${folder}: ${count}`);
console.log(`Already installed and identical: ${report.same} file(s)`);
console.log(`Kept yours (different from the kit, NOT overwritten): ${report.kept.length} file(s)`);
for (const file of report.kept) console.log(`  ${file}`);
console.log('settings.json:');
for (const line of report.settings) console.log(`  ${line}`);
