---
name: i18n-check
description: Verify translation completeness - diff all locale files against the reference language, list missing and orphaned keys per language, scan templates for hardcoded strings. Use before PRs with user-facing text, or when the user asks to check/sync translations.
---

# i18n Check Skill

Verify that every supported language has every translation key. Deterministic — follow the steps exactly.

## Steps

### 1. Locate locale files
Glob for them (check all, projects differ):
- `**/locales/*.json`, `**/i18n/**/*.json`, `**/lang/*.json`, `**/locales/*.ts`
- Check `nuxt.config.*` / `i18n.config.*` for the configured locales and default language

### 2. Determine the reference language
- Use the project's default locale from config.
- If unclear: use the file with the MOST keys and say which one you picked.

### 3. Compare keys
Write this script to the scratchpad and run it (adjust the directory path):

```javascript
// i18n-diff.mjs — node i18n-diff.mjs <locales-dir> <reference-lang>
import fs from 'fs'; import path from 'path';
const [dir, ref] = process.argv.slice(2);
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flat(v, p + k + '.') : [p + k]);
const load = f => new Set(flat(JSON.parse(fs.readFileSync(f, 'utf8'))));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const refKeys = load(path.join(dir, ref + '.json'));
for (const f of files) {
  if (f === ref + '.json') continue;
  const keys = load(path.join(dir, f));
  const missing = [...refKeys].filter(k => !keys.has(k));
  const orphans = [...keys].filter(k => !refKeys.has(k));
  console.log(`\n== ${f}: ${missing.length} missing, ${orphans.length} orphaned`);
  missing.forEach(k => console.log(`  MISSING  ${k}`));
  orphans.forEach(k => console.log(`  ORPHAN   ${k}`));
}
```

### 4. Scan for hardcoded strings (spot check)
Grep templates for user-facing literals that bypass i18n:
- Vue: text between tags that isn't `{{ $t(...) }}` / `{{ t(...) }}` — grep for `>[A-Z][a-z]+ [a-z]` in `*.vue` as a heuristic
- Attributes: `placeholder="`, `title="`, `label="`, `aria-label="` with literal text
- Report hits as CANDIDATES for review — not every hit is a bug.

### 5. Report

```
i18n Check — [project]
Reference: [lang] ([N] keys)

| Language | Missing | Orphaned | Status |
|----------|---------|----------|--------|
| nl       | 0       | 2        | ⚠️     |

Missing keys per language: [list]
Hardcoded string candidates: [file:line list, or "none found"]
```

### 6. Offer to fix
Ask which fix the user wants:
- **Add missing keys** with a draft translation, each marked so they can be reviewed (e.g. value prefixed with `[REVIEW] `). Match the tone/formality of existing translations in that language.
- **Remove orphaned keys** — list them first, confirm before deleting.
- **Report only** — stop here.

## Rules
- Never silently invent translations without the review marker.
- Never delete keys without listing them and getting confirmation.
- Keep key ORDER consistent with the reference file when adding.
