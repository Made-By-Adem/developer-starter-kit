---
name: deploy
description: Prepare and execute a production deployment - detect deploy method, run pre-deploy checklist, assess risk, present plan, verify after. Use when the user asks to deploy, release, or ship to production.
---

# Deploy Skill

Prepare and execute a deployment to production.

## Steps

1. **Detect deployment method**
   - Check for deploy scripts (DeployToServer.ps1, deploy.sh, etc.)
   - Check for Docker Compose files
   - Check for CI/CD config (.github/workflows, etc.)
   - Check project CLAUDE.md for deployment documentation

2. **Pre-deploy checklist**
   - [ ] All changes committed?
   - [ ] Branch up to date with main?
   - [ ] Any pending migrations? (Must apply BEFORE code deploy)
   - [ ] Any new environment variables needed?
   - [ ] Lint/type checks pass?

3. **Risk assessment**
   - Run **release-risk** agent if changes are significant
   - Identify: affected components, downtime needed, rollback plan

4. **Present deploy plan**
   ```
   Deploy target: [server/service]
   Method: [script/docker/CI]
   Components: [what gets deployed]

   Pre-deploy:
   - [ ] Migration: [file] (apply manually first)
   - [ ] Env vars: [new vars needed]

   Deploy steps:
   1. [step]
   2. [step]

   Rollback:
   1. [step]

   Proceed?
   ```

5. **On approval**: Execute deployment
6. **Post-deploy verification**
   - Health check endpoints
   - Verify key functionality
   - Check logs for errors

## Rules

- NEVER deploy without user approval
- NEVER apply database migrations automatically
- Always verify migrations are applied BEFORE code deploy
- If deploying to multiple servers, confirm order with user
- Monitor logs after deploy for at least the first few minutes
