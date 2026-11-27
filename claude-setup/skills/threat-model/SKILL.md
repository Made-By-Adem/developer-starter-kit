---
name: threat-model
description: Defensive threat model of a feature, service or whole app - data map, trust boundaries, compromise scenarios, scored risks with mitigations. Use before building anything that touches auth, payments, tenant data, uploads, webhooks or AI agents, or when asked "how exposed are we" or "what if X got hacked". Not for scanning code (security-auditor agent) or a live incident (incident skill).
---

# Threat Model Skill

Model the system, never touch it. This skill reads code and config. It does not scan, exploit or change anything.

## Steps

### 1. Scope
- Name the target (one feature, one service, or the whole app) and what is out of scope.
- Build the inventory from the repo and config: routes, tables, storage buckets, queues, third-party services, scheduled jobs, AI agents and their tools.
- Never invent an inventory. What you could not inspect is listed as "not inspected".

### 2. Data map
Classify every place that holds data:

| Class | Examples |
|-------|----------|
| Credentials | API keys, tokens, service-role keys, signing keys |
| Customer data | Personal details, financial or health data, tenant content |
| Internal | Logs, config, business data that is not public |
| Public | Marketing content, published docs |

An asset without a class is **unclassified**, not safe. List unclassified assets explicitly.

### 3. Trust boundaries and entry points
- Where does untrusted input enter? Public routes, webhooks, file uploads, imports, emails, URL parameters.
- Where does one tenant end and the next begin? Name the column and the policy that enforce it.
- Where does text written by someone else reach an AI agent? That is an entry point too: the agent holds the user's permissions, and injected text borrows them. Rank these by what the agent can do, not by how harmless the text looks.
- Which service holds credentials for which other service?

### 4. Compromise scenarios
For each important asset, assume it is compromised and answer:
- What data is exposed, of which class?
- Which credentials does it hold, and what do those unlock next (one hop further)?
- How would we notice? Name the log or alert, or state "nothing would notice".
- What is the first response step?

Use STRIDE as a checklist so no category is skipped: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege.

### 5. Score
`score = likelihood (1-5) x impact (1-5)`: Low 1-4, Medium 5-9, High 10-14, Critical 15-25.

- Impact follows the data class and the reach: credentials to many systems or customer data at scale is 5; one data-bearing system is 4; internal data is 3; public data with no next hop is 1.
- Likelihood follows exposure: public URL, missing auth, unpatched dependency, shared or long-lived credentials.

### 6. Mitigations
For each High and Critical risk: one concrete mitigation, the file or setting it belongs in, and whether it blocks the attack or only detects it. Accepting a risk is allowed, but it is the user's decision and it is written down with a review date.

## Output

```
Threat model: [target]            Date: YYYY-MM-DD
Not inspected: [list or none]

Data map: [asset | class | where]
Entry points: [entry | trust level | what it can reach]
Risks (highest first):
  R1 [title] | likelihood x impact = score | scenario in one sentence | mitigation | blocks or detects
Unclassified assets: [list or none]
```

Save it where the project's CLAUDE.md keeps security documents. If it defines no place, present it in chat and ask.

## Hard Rules
- Read-only. No scans, no exploits, no changes.
- Refer to credentials by variable name only. Never write a secret value into the model.
- Every likelihood and impact score names the evidence behind it.
- A finding that needs a code change goes to the **plan** or **hotfix** skill. Do not fix it here.
