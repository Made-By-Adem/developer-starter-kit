#!/usr/bin/env node
// Global Stop hook. Checks the turn that just ended: did Claude change files,
// then say "works" / "fixed" / "done", without running anything after the last
// change? The final message is a claim; the tool calls in the transcript are
// the evidence.
//
// Default mode is LOG ONLY: it appends one line per turn that looks unverified
// to <config dir>/logs/verify-claim.jsonl and never blocks. Read that log for a
// while first. When the hits are real, set VERIFY_CLAIM_MODE=block in the `env`
// section of settings.json: the hook then exits 2 once per turn and asks Claude
// to verify or to reword the claim.
//
// The log holds counts and the matched word only, never message text.
// Any error exits 0: a broken hook must never stop a session.

const fs = require('fs');
const os = require('os');
const path = require('path');

const TAIL_BYTES = 4 * 1024 * 1024; // long transcripts: the last turn is at the end

const EDIT_TOOLS = /^(Edit|Write|MultiEdit|NotebookEdit)$/;
// Tools that can show a result: a shell command, a browser, a database query.
const BROWSER_OR_DB = /^mcp__.*(chrome|browser|playwright|execute_sql|query)/i;
// Shell commands that only look around or move files do not prove behaviour.
const NOT_EVIDENCE = /^\s*(git|ls|cat|head|tail|echo|cd|pwd|mkdir|cp|mv|rm|touch|chmod|find|grep|rg|wc|diff|which|printf)\b/;

// Completion claims in English and Dutch.
const CLAIM = /\b(works|working|fixed|resolved|verified|tested|passes|passing|all green|is done|done\.|completed|werkt|opgelost|gefixt|geverifieerd|getest|is klaar|klaar\.)/i;
// Honest wording that takes the claim back.
const HEDGE = /\b(not verified|unverified|not tested|untested|could not (run|verify|test)|did not (run|verify|test)|niet geverifieerd|niet getest|ongetest|kon niet (draaien|testen|verifi))/i;

function readTail(file) {
  const size = fs.statSync(file).size;
  const start = Math.max(0, size - TAIL_BYTES);
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    return buf.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function isUserPrompt(entry) {
  if (entry.type !== 'user' || entry.isSidechain || entry.isMeta) return false;
  const content = entry.message?.content;
  if (typeof content === 'string') return true;
  return Array.isArray(content) && !content.some((b) => b.type === 'tool_result');
}

function analyse(lines, lastMessage) {
  const entries = [];
  for (const line of lines) {
    try { entries.push(JSON.parse(line)); } catch { /* cut-off first line of the tail */ }
  }
  let start = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isUserPrompt(entries[i])) { start = i; break; }
  }

  let edits = 0;
  let checksAfterLastEdit = 0;
  let text = '';
  for (const entry of entries.slice(start + 1)) {
    if (entry.type !== 'assistant' || entry.isSidechain) continue;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type === 'text') text = block.text || text;
      if (block.type !== 'tool_use') continue;
      if (EDIT_TOOLS.test(block.name)) {
        edits += 1;
        checksAfterLastEdit = 0;
      } else if (block.name === 'Bash') {
        if (!NOT_EVIDENCE.test(block.input?.command || '')) checksAfterLastEdit += 1;
      } else if (BROWSER_OR_DB.test(block.name)) {
        checksAfterLastEdit += 1;
      }
    }
  }

  const finalText = lastMessage || text;
  const claim = finalText.match(CLAIM);
  return {
    edits,
    checksAfterLastEdit,
    claim: claim ? claim[1].toLowerCase() : null,
    hedged: HEDGE.test(finalText),
  };
}

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const hook = JSON.parse(input);
    if (hook.stop_hook_active) process.exit(0); // already asked once this turn
    if (!hook.transcript_path || !fs.existsSync(hook.transcript_path)) process.exit(0);

    const result = analyse(
      readTail(hook.transcript_path).split('\n'),
      typeof hook.last_assistant_message === 'string' ? hook.last_assistant_message : '',
    );
    const unverified =
      result.edits > 0 && result.claim && !result.hedged && result.checksAfterLastEdit === 0;
    if (!unverified) process.exit(0);

    const mode = process.env.VERIFY_CLAIM_MODE === 'block' ? 'block' : 'log';
    const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    const logDir = path.join(configDir, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      path.join(logDir, 'verify-claim.jsonl'),
      JSON.stringify({
        time: new Date().toISOString(),
        session: hook.session_id || null,
        cwd: hook.cwd || null,
        mode,
        claim: result.claim,
        edits: result.edits,
      }) + '\n',
    );

    if (mode === 'block') {
      console.error(
        `verify-claim.cjs: the last message says "${result.claim}" after ${result.edits} file change(s), ` +
        'but nothing was run after the last change. Show the proof that fits the claim ' +
        '(endpoint: curl -i; data: SELECT; page: browser; config: read it back; logic: run the test), ' +
        'or reword the claim to "not verified" and say why.'
      );
      process.exit(2);
    }
  } catch {
    // never block on hook failure
  }
  process.exit(0);
});
