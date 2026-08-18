# backend-nest-boilerplate

NestJS + Prisma backend boilerplate built on layer-first DDD/CQRS, mirroring the conventions of the
sibling `backend-dotnet-boilerplate` (Onion/Clean Architecture) where the platforms allow it.

## Stack

| Concern            | Choice                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| Runtime / language | Node 24, TypeScript 7                                                   |
| Framework          | NestJS 11                                                               |
| CQRS dispatch      | `@nestjs/cqrs` (`CommandBus`/`QueryBus`/`EventBus`)                     |
| Persistence        | Prisma 7 with the `prisma-client` generator + `@prisma/adapter-pg`      |
| Transactions       | `@nestjs-cls/transactional` (AsyncLocalStorage ambient context)         |
| Messaging          | RabbitMQ via `amqplib`, fed by a transactional outbox                   |
| Auth               | `@nestjs/jwt` (bearer) + HMAC client credentials for machine-to-machine |

## Getting started

```bash
cp .env.example .env
npm install
docker compose up -d postgres rabbitmq
npm run prisma:migrate      # creates the schema
npm run build && npm start  # http://localhost:3000
```

`npm run docker:up` builds and runs the API in Docker alongside Postgres and RabbitMQ instead.

## Layers

Dependency direction is `api → infrastructure → application → domain → shared-kernel`, enforced at
compile time: every layer is its own TypeScript project (`src/<layer>/tsconfig.json`) that lists only
the layers it may reference, so an import against the arrow fails `tsc`, not just lint.

- **`shared-kernel/`** — framework-free primitives: `Result`/`AppError`, id generator, time provider.
- **`domain/`** — entities, value objects, domain events, repository contracts. No Prisma, no Nest.
- **`application/`** — commands, queries, their handlers, and the ports (`ReadDb`, client interfaces,
  `RequestManager`) that infrastructure implements.
- **`infrastructure/`** — Prisma repositories and schema, the outbox, HTTP clients, config factories.
- **`api/`** — controllers, request DTOs, guards, interceptors, the global exception filter.

Cross-layer imports use `@<layer>/*` path aliases; same-layer imports stay relative.

## How a write flows

```
Controller → CommandBus → CommandHandler → Repository.update(aggregate)
                                              └─ AggregateRepositoryBase.commit()
                                                   ├─ open transaction (ambient, via TransactionHost)
                                                   ├─ subclass persists the aggregate
                                                   ├─ map domain events → integration events → outbox rows
                                                   └─ EventBus.publishAll() for in-process handlers
                                              OutboxProcessor (every 5s) → RabbitMQ fanout exchange
```

Handlers return `Result<T>`; the controller passes it through `unwrapResult()`, which throws for
failures so the global filter can render RFC 7807 Problem Details. Domain exceptions stay reserved
for invariants that should be unreachable.

## Endpoint categories

One global `AuthGuard` picks the scheme from route metadata:

| Folder                     | Auth                                                 | Example                                      |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `api/modules/app/`         | JWT bearer (default)                                 | `GET /api/todo-lists`                        |
| `api/modules/integration/` | `@Integration('<caller>')` — HMAC client credentials | `GET /api/integration/mobile-app/todo-lists` |
| `api/modules/public/`      | `@Public()` — none                                   | `GET /health`                                |

Integration callers send `X-Client-Id`, plus `X-Timestamp` and `X-Token` =
`HMAC-SHA256(clientSecret, timestamp)` inside the replay window. Add a caller to
`api/common/auth/integration.config.ts`, then tag its routes.

In non-production, `POST /dev/token` mints a JWT for local testing.

## Idempotency

Routes wrapped in `IdempotencyInterceptor` require an `Idempotency-Key` header. The key is inserted
into `processed_requests` before the handler runs; a unique-constraint violation (`P2002`) is what
signals a duplicate, so concurrent retries cannot both slip through a read-then-write check.

## Tests

```bash
docker compose up -d postgres   # integration tests need a real database
npm run test:db                 # one-off: creates and migrates the test database
npm test                        # unit + integration
```

- **Unit** (`src/**/*.spec.ts`) — domain rules, the integration-event mapper, pagination maths, the
  HMAC authenticator, `unwrapResult`. No I/O.
- **Integration** (`test/*.spec.ts`) — run against real Postgres on `TEST_DATABASE_URL`:
  - `unit-of-work.spec.ts` — the transaction boundary: aggregate + children persist together, the
    outbox row commits with them, events publish in-process, a failed write rolls back _both_ the
    aggregate and its outbox row, and a re-saved aggregate cannot republish drained events.
  - `outbox-processor.spec.ts` — ordering, marking processed, recording failures, retrying, and
    never republishing.
  - `api.spec.ts` — HTTP end to end: the three auth categories, Problem Details shapes, idempotency
    replay, and a full create → update → complete → list lifecycle.

Jest runs through `@swc/jest`, not `ts-jest` — `ts-jest` peer-caps TypeScript below 7. SWC does not
type-check, so keep `npm run build` in CI as the type gate.

## Scripts

| Script                              | What it does                                                 |
| ----------------------------------- | ------------------------------------------------------------ |
| `npm run build`                     | `tsc -b` then `tsc-alias` to rewrite path aliases in `dist/` |
| `npm start`                         | Runs `dist/api/main.js`                                      |
| `npm run dev`                       | `tsc -b --watch`                                             |
| `npm run prisma:generate`           | Regenerates the Prisma client into `schema/generated/`       |
| `npm run prisma:migrate`            | Creates and applies a dev migration                          |
| `npm run prisma:deploy`             | Applies pending migrations (CI/production)                   |
| `npm run docker:up` / `docker:down` | Full stack up/down                                           |
| `npm test`                          | Unit + integration suites                                    |
| `npm run test:db`                   | Creates and migrates the integration-test database           |
| `npm run lint` / `npm run format`   | oxlint / Prettier                                            |

## Conventions

Decisions and rationale live in `.claude/rules/`: `architecture.md` (layering, ports, cross-cutting
concerns), `ddd.md` (DDD tactical patterns),
`code-style.md`, `doc-style.md`. Read those before adding a feature — they record _why_ things
diverge from the `.NET` original, which the code alone does not explain.
