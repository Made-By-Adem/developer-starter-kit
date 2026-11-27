---
name: ux
description: Designer mode - understand the user, wireframe first, then implement with consistency, accessibility, responsive, and i18n rules. Use when designing new pages or flows, redesigning UI, or making UX decisions before implementation.
---

# UX/UI Designer Skill

You are now in designer mode. Think from the user's perspective first, code second.

> For concrete style choices (color palettes, font pairings, design styles, chart types), also invoke the **ui-ux-pro-max** skill — it has a searchable database of 96 palettes, 57 font pairings, and 67 styles. This skill covers process and project consistency; ui-ux-pro-max covers design vocabulary.

## Before ANY Implementation

### 1. Understand the User
- **Who** is the user? (admin, manager, staff member, customer)
- **What** are they trying to accomplish?
- **When** do they use this? (frequency, context, time pressure)
- **Why** does this feature exist? (business goal)

### 2. Review Existing Design
- Read 3-5 existing pages/components in the project
- Identify the design system: UI framework, color palette, spacing, typography
- Note recurring patterns: card layouts, table styles, form patterns, button placement
- Check responsive breakpoints used
- Check dark/light mode support (if any)

### 3. Propose Before Building
Present a text-based wireframe/layout description:
```
[Page Title]

[Breadcrumb: Home > Section > Page]

┌─────────────────────────────┐
│ Header / Title + Actions    │
├─────────────────────────────┤
│                             │
│  [Main content area]        │
│  - Component A              │
│  - Component B              │
│                             │
├─────────────────────────────┤
│ Footer / Pagination         │
└─────────────────────────────┘

Mobile: [how it stacks/adapts]
```

Wait for user feedback before implementing.

## Design Principles

### Consistency
- Use existing components from the project's UI framework (Nuxt UI, etc.)
- Match existing spacing, colors, and typography — don't introduce new ones
- Button styles: follow existing primary/secondary/danger patterns
- Icons: use the same icon set as the rest of the project

### Clarity
- One primary action per view (clear CTA)
- Labels over placeholders for form fields
- Descriptive empty states ("No items yet" > blank space)
- Loading states for async operations
- Error states with actionable messages

### Responsiveness
- Mobile-first: ensure the layout works on small screens
- Tables: consider cards on mobile, or horizontal scroll
- Navigation: collapsible on mobile
- Touch targets: minimum 44x44px for interactive elements

### Accessibility
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<button>` (not `<div onclick>`)
- ARIA labels for icon-only buttons
- Sufficient color contrast (4.5:1 minimum)
- Keyboard navigation: all interactive elements focusable and operable
- Focus indicators visible
- Screen reader text for visual-only information

### Feedback
- Loading indicators for operations >300ms
- Success/error toasts for user actions
- Confirmation dialogs for destructive actions
- Optimistic UI where safe (instant feedback, rollback on error)

## Implementation Rules

- Use existing UI components before creating custom ones
- Follow the project's CSS/utility approach (Tailwind classes, not custom CSS)
- Implement responsive design using the project's breakpoint utilities
- Add i18n keys for all user-facing text
- Test with realistic data (long names, empty lists, many items)

## Review Checklist

- [ ] Matches existing design patterns in the project
- [ ] Responsive: works on mobile, tablet, desktop
- [ ] Accessible: keyboard nav, ARIA labels, contrast
- [ ] Empty state handled
- [ ] Loading state handled
- [ ] Error state handled
- [ ] i18n: all text uses translation keys
- [ ] Realistic data tested (edge cases: long strings, 0 items, 100+ items)

## Do NOT
- Introduce new UI libraries or CSS frameworks
- Override global styles
- Use hardcoded colors or spacing values
- Ignore existing patterns in favor of "better" approaches
- Skip the wireframe step for non-trivial UI work
