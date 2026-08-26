---
paths:
  - 'src/**/*.ts'
---

# Architecture: layer-first

- Importing against the dependency direction (`api → infrastructure → application → domain →
shared-kernel`) is a compile error, not just a lint error — each layer is its own TypeScript
  project.
