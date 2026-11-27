---
name: visualize
description: Turn code, a process or an explanation into a diagram that answers one question - flowchart, sequence diagram, database diagram, state diagram or timeline, written as Mermaid so it lives in the repository and renders on GitHub. Use when asked to visualize, draw, diagram or map a flow, a request path, a schema, a state machine or a process, or when an explanation gets too long for text. Not for charts of numbers, and not for logo-style architecture pictures when a dedicated diagram skill is installed.
---

# Visualize Skill

A diagram earns its place when it answers one question faster than text. One diagram, one question.

## Steps

### 1. Name the question
Write it down first: "What happens between the click on Pay and the receipt?" or "Which tables hang off `orders`?". If there are two questions, make two diagrams.

### 2. Pick the form

| Question | Form | Mermaid type |
|----------|------|--------------|
| What happens in which order, with decisions? | Flowchart | `flowchart TD` |
| Who talks to whom, and when? (browser, API, database, third party) | Sequence diagram | `sequenceDiagram` |
| How are tables related? | Database diagram | `erDiagram` |
| Which states can a thing be in, and what moves it? (order, payment, subscription) | State diagram | `stateDiagram-v2` |
| What happened when? (incident, release) | Timeline | `timeline` |
| How do services and infrastructure connect? | Architecture diagram | `flowchart LR` with subgraphs, or a dedicated architecture diagram skill if one is installed |

Charts of numbers (bars, lines, dashboards) are not this skill: use a charting skill or library.

### 3. Take the facts from the source
- Read the actual code, schema or logs. Names of routes, tables, columns, states and services are copied, never guessed.
- For a database diagram, inspect the real schema first (**db-inspect** skill when available).
- Something you could not verify is drawn with a dashed line or marked with `?`.

### 4. Draw
- At most about 15 nodes. More means the question is too wide: split it or group nodes in subgraphs.
- Label every arrow that is not obvious: the HTTP method and path, the event name, the condition.
- Main path top to bottom or left to right, in reading order. Error paths to the side.
- Plain words on the nodes. Put the file path or function name in a second line only when the reader needs it.
- Do not rely on colour alone to carry meaning.

### 5. Check it renders
- Mermaid is strict. Quote labels that contain brackets, colons or slashes: `A["POST /api/orders"]`.
- If a Mermaid renderer is available in the project, render once. Otherwise re-read the syntax line by line and say that it was not rendered.

### 6. Deliver
- Default: a fenced `mermaid` code block in chat. It renders on GitHub, in Notion and in most editors.
- For the repository: put it in the document it explains (README, a guide, the pull request description). No separate file for one diagram unless the project keeps diagrams in one place.
- When the user wants a picture or a page: a self-contained HTML or SVG file, no external scripts.

## Output

```
Question: [the one question]
Source: [files, tables or logs read]
[the diagram]
Not verified: [parts drawn from assumption, or none]
```

## Hard Rules
- Nothing in the diagram that the source does not show.
- No secrets, tokens, customer names or internal addresses in a diagram.
- No new tool or dependency installed to render a diagram without asking.
