#!/usr/bin/env node
// Global PreToolUse hook for Bash. Blocks `pkill` calls with anything after the
// pattern. macOS (BSD) pkill stops reading options at the first pattern, so in
// `pkill -f "foo" -f` the trailing `-f` becomes a second pattern that matches
// every process with "-f" in its arguments: all Chrome/Electron helpers
// (--field-trial-handle), VS Code, Spotify, ....
// Exit 2 blocks the tool call and feeds stderr back to Claude.

// pkill options that take a value (BSD): -F file, -G gid, -g pgrp, -P ppid,
// -s sid, -t tty, -U uid, -u euid, -j jail, -c class.
const OPTS_WITH_ARG = new Set(['F', 'G', 'g', 'P', 's', 't', 'U', 'u', 'j', 'c']);

// Split a command into segments of shell words, respecting quotes.
function segments(cmd) {
  const segs = [];
  let words = [];
  let cur = '';
  let inWord = false;
  const pushWord = () => { if (inWord) words.push(cur); cur = ''; inWord = false; };
  const pushSeg = () => { pushWord(); if (words.length) segs.push(words); words = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (c === "'") {
      const j = cmd.indexOf("'", i + 1);
      cur += cmd.slice(i + 1, j === -1 ? cmd.length : j);
      inWord = true;
      i = j === -1 ? cmd.length : j;
    } else if (c === '"') {
      let j = i + 1;
      while (j < cmd.length && cmd[j] !== '"') { if (cmd[j] === '\\') j++; cur += cmd[j] ?? ''; j++; }
      inWord = true;
      i = j;
    } else if (c === '\\') {
      cur += cmd[i + 1] ?? ''; inWord = true; i++;
    } else if (/\s/.test(c)) {
      if (c === '\n') pushSeg(); else pushWord();
    } else if (';&|()`{}'.includes(c)) {
      pushSeg();
    } else {
      cur += c; inWord = true;
    }
  }
  pushSeg();
  return segs;
}

// Return a reason string when a pkill word list has extra args after the pattern.
function check(words) {
  const idx = words.findIndex((w) => w === 'pkill' || w.endsWith('/pkill'));
  if (idx === -1) return null;
  const args = words.slice(idx + 1);
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '--') { i++; break; }
    if (!a.startsWith('-') || a === '-') break;
    const letters = a.slice(1);
    if (/^\d+$/.test(letters) || /^[A-Z]+$/.test(letters) && letters.length > 1) { i++; continue; } // -9, -TERM
    const last = letters[letters.length - 1];
    i += OPTS_WITH_ARG.has(last) ? 2 : 1;
  }
  const pattern = args[i];
  const extra = args.slice(i + 1).filter((w) => !/^\d?>/.test(w) && !/^\/dev\//.test(w));
  if (pattern !== undefined && extra.length) {
    return `pattern ${JSON.stringify(pattern)} is followed by ${JSON.stringify(extra.join(' '))}`;
  }
  return null;
}

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    cmd = JSON.parse(input).tool_input?.command || '';
  } catch {
    process.exit(0); // unparsable input: never block on hook failure
  }
  if (!/\bpkill\b/.test(cmd)) process.exit(0);

  for (const words of segments(cmd)) {
    const reason = check(words);
    if (reason) {
      console.error(
        `BLOCKED by block-pkill-extra-args.cjs: ${reason}. ` +
        'macOS pkill treats every word after the pattern as another pattern, so a stray ' +
        '`-f` matches (and kills) every Chrome/Electron/VS Code helper process. ' +
        'Put all options BEFORE the pattern and give exactly one pattern, e.g. ' +
        '`pkill -f "dotenv_config_path=.env.dev"`. Check first with `pgrep -lf "<pattern>"`.'
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
