---
paths:
  - '**/*.md'
---

# Documentation / explanation style

- Short, bullet points carrying the main idea — no long prose, no rambling explanation.

## Writing `.claude/rules/*.md`

- A rule is only worth writing when breaking it fails **silently**: the compiler will not catch it
  and reading the code will not show it. If a wrong package breaks the build immediately, or one
  existing file shows the pattern, no rule is needed.
- Record the invariant, not the current name of an implementation.
- Say it once. A rule written in another file gets a pointer, not a copy.
