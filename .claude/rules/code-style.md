---
paths:
  - 'src/**/*.ts'
---

# TypeScript conventions

- New IDs: UUIDv7 (time-ordered), never `crypto.randomUUID()` — that one produces a UUIDv4, still
  builds and runs fine, but silently yields the wrong kind of ID. Generate through
  `shared-kernel/id-generator/`.
- Use `class` when the value must exist at runtime: entities, value objects, commands/queries. Use
  `interface` when a class will `implement` it or another interface will `extend` it. Use `type`
  for unions, utility-type compositions, and plain data shapes nobody implements — those cannot be
  written as an `interface`.
- Cross-layer imports use the `@<layer>/*` path aliases, never relative `../../..` chains —
  same-folder/same-layer imports stay relative (`./x`) as usual.
- Length: ~30-40 lines per method, ~200-300 lines per class, and watch the parameter count (>4-5 →
  split it up or use a pattern).
- Comments: short, one line where possible, written only when the code cannot speak for itself — a
  non-obvious _why_, a gotcha, a `ponytail:`/`TODO` marker. Never restate what the code does, never
  record architectural rationale or decisions already settled in chat, never leave
  template-generated comments behind. No JSDoc unless the package is genuinely published or
  consumed externally.
