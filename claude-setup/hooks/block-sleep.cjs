#!/usr/bin/env node
// Global PreToolUse hook for Bash. Blocks idle waiting that burns a full model
// turn per poll: `sleep N` with N >= 5, and any loop that contains `sleep`.
// Short sleeps (1-4 s, e.g. waiting for a port to open) stay allowed.
// Exit 2 blocks the tool call and feeds stderr back to Claude.

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    cmd = JSON.parse(input).tool_input?.command || '';
  } catch {
    process.exit(0); // unparsable input: never block on hook failure
  }

  const SEP = '(?:^|[;&|(`{]\\s*|\\n\\s*|\\bdo\\s+|\\bthen\\s+)';
  const longSleep = new RegExp(SEP + String.raw`sleep\s+(\d+(?:\.\d+)?)(?:[smh])?\b`, 'ig');
  const loopSleep = /\b(?:while|until|for)\b[\s\S]*\bsleep\s+\d/i;

  let hit = false;
  let m;
  while ((m = longSleep.exec(cmd)) !== null) {
    if (parseFloat(m[1]) >= 5) { hit = true; break; }
  }
  if (!hit && loopSleep.test(cmd)) hit = true;

  if (hit) {
    console.error(
      'BLOCKED by block-sleep.cjs: do not poll with sleep. ' +
      'Each poll costs a full turn. Block on the result instead: a background Bash call ' +
      '(run_in_background) notifies you when it exits; the Monitor tool waits on a condition; ' +
      'for a server use ' +
      '`curl --retry 30 --retry-connrefused --retry-delay 2 <url>`. Sleeps under 5 s are allowed.'
    );
    process.exit(2);
  }
  process.exit(0);
});
