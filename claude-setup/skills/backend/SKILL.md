---
name: backend
description: Rules for writing backend code (routes, controllers, services, validation, error handling, namespace-scoped DB access). Use when creating or modifying API endpoints, middleware, server functions, or any server-side business logic.
---

# Backend Skill

You are now working on backend code. Follow these rules strictly.

## Before Writing Code

1. **Read existing patterns first**
   - Find how similar endpoints/features are structured in the project
   - Identify the architecture chain: routes → controllers → services/serverFunctions → repositories/DB
   - Follow the exact same pattern — don't invent new approaches

2. **Check project CLAUDE.md** for backend-specific conventions, middleware patterns, and error handling

3. **Trace namespace resolution**
   - Grep the codebase for how `namespace_id` is resolved in similar code
   - NEVER assume namespace_id from a related entity
   - Use the exact same pattern as existing code

## Implementation Rules

### Architecture Chain
- Follow the project's chain exactly (don't skip layers)
- Routes: define path, method, middleware stack, controller function
- Controllers: parse request, call service/serverFunction, format response
- Services/ServerFunctions: business logic, orchestration
- Repositories (if applicable): database queries only

### Route Setup
- On Express 4, wrap route handlers in the project's `asyncHandler(fn)`; Express 5 forwards async errors by itself
- Middleware order: auth → permission → validation → controller
- Mount new route files in server.js entry point

### Validation
- Use Joi schemas (or whatever validation the project uses)
- Validate at the route level, not in services
- Handle both null AND empty string cases
- Grep for existing validation patterns before writing new ones

### Error Handling
- Use custom error classes from `utils/errors.js`
- Don't catch and swallow errors — let them propagate to error middleware
- Return consistent response format: `{ success, data, error }`

### Database Access
- Always use namespace_id scoping in queries
- Use secure views for encrypted data (never query raw encrypted tables)
- Follow soft delete pattern where the project uses it
- Verify column types by reading existing schema before referencing

### Property Names
- ALWAYS grep the codebase to verify exact column names and property names
- Don't guess — check the actual schema, models, or existing queries

## Do NOT
- Skip layers in the architecture chain
- Create new utility files for one-time operations
- Add new dependencies without asking
- Bypass auth or permission middleware
- Write raw SQL in controllers (use the data access layer)

## After Implementation

Run the review checklist:
- [ ] Architecture chain followed correctly
- [ ] Namespace isolation maintained
- [ ] Property names verified via grep
- [ ] Empty/null edge cases handled
- [ ] Error classes used properly
- [ ] Validation at route level
- [ ] Async errors reach the error middleware (asyncHandler on Express 4, automatic on Express 5)
- [ ] Middleware stack complete (auth + permission + validation)
