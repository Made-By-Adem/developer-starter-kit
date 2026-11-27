---
name: frontend
description: Rules for writing Vue 3 / Nuxt frontend code (components, pages, composables, stores, i18n, permissions, responsive templates). Use when creating or modifying anything under the frontend - pages, components, layouts, or client-side state.
---

# Frontend Skill

You are now working on frontend code. Follow these rules strictly.

## Before Writing Code

1. **Read existing patterns first**
   - Find 2-3 similar pages/components in the project
   - Note: component structure, naming, styling approach, state management pattern
   - Follow the same patterns exactly — don't invent new ones

2. **Identify the design system**
   - Check for Nuxt UI, TailwindCSS, or other UI framework
   - Check existing color tokens, spacing, component usage
   - Use existing components before creating new ones

3. **Check project CLAUDE.md** for frontend-specific conventions

## Implementation Rules

### Vue/Nuxt
- Vue 3 Composition API with `<script setup>` — always
- Reactive state: `ref()` for primitives, `reactive()` for objects
- Props: use `defineProps()` with TypeScript-style defaults where the project does
- Emits: use `defineEmits()`
- API responses follow `{ success, data, error }` format

### Template Quality
- **No illegal nesting** — validate structure (no `<div>` in `<tbody>` without `<tr>`, etc.)
- **Responsive**: check mobile layout, use responsive utilities
- **Accessibility**: proper labels, ARIA attributes for interactive elements, keyboard navigation
- Components properly imported

### Permissions & Routing
- For any new page: add navigation guard (middleware)
- For any new page: add to navigation menu with role check
- Verify: middleware auth + frontend guard + backend RLS — all three must exist

### i18n
- Check which languages the project supports
- Add translations for ALL supported languages
- Use translation keys, not hardcoded strings for user-facing text

### State Management
- Check how existing features manage state (stores, composables, local state)
- Follow the same pattern
- Don't introduce new state management approaches

## Do NOT
- Run `npm run build` or `nuxt build` during development
- Delete `.nuxt` or build cache directories
- Install new dependencies without asking
- Create new utility files for one-time operations

## After Implementation

Run the review checklist:
- [ ] Template nesting valid
- [ ] Responsive on mobile
- [ ] All languages updated (i18n)
- [ ] Permissions complete (middleware + guard + RLS)
- [ ] Follows existing component patterns
- [ ] No hardcoded strings in template
