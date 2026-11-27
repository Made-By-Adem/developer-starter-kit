# Skills

Claude Code skills vendored into this starter kit. Each folder with a `SKILL.md` is a standalone skill that Claude Code automatically discovers.

## Included

| Skill | Purpose |
|-------|---------|
| `ui-ux-pro-max/` | Main design-intelligence skill: 80 UI styles, 194 color palettes, 74 font pairings, 141 UX guidelines, 25 chart types across 23 stacks. |
| `design-system/` | Generate a complete, tailored design system for a product (MASTER.md + page overrides). |
| `design/` | General visual-design reasoning helpers. |
| `ui-styling/` | Font rendering + style previews (includes Canvas font files). |
| `brand/` | Brand identity helpers. |
| `banner-design/` | Banner / hero composition helpers. |
| `slides/` | Presentation slide design helpers. |

## Source & License

Vendored from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT). Current copy: version 2.15.0, commit `72e5fc7` (2026-11-27), taken unchanged from the `.claude/skills/` folder of that repository. See `LICENSE-ui-ux-pro-max.txt` for the upstream license.

## Updating

To pull in a newer version, re-run:

```bash
npx uipro-cli init --ai claude
```

or manually replace the folders above from the upstream repo.

## Good to know

- The search scripts need Python 3 and work offline.
- The logo, icon and brand-mockup generators in `design/scripts/` are optional. They send your prompt to an outside image service (Google Gemini, Atlas Cloud, MuAPI or UberLLM) and only work after you set that service's API key yourself. Nothing is sent without a key.
- The `tests/` folders come from upstream. A few of them expect the upstream repository layout and only run there.
