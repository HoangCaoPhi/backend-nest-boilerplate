---
paths:
  - 'src/**/*.ts'
---

# Domain Model (DDD tactical patterns)

## Entity & Aggregate

- An entity's identity is its `id`, never its attributes.
- A domain entity carries behaviour (methods) as well as data — avoid an anemic domain model
  (getters/setters only) unless the aggregate really is plain CRUD.
- No public setters — every mutation goes through an explicit method named in the ubiquitous
  language. Keep fields `private`/`readonly` with public getters and mutate only through named
  methods (`complete()`, `rename()`), never `entity.status = x`.
- Expose child collections as `ReadonlyArray<T>` backed by a private field; mutate them only
  through methods on the aggregate root/entity, never directly from outside.
- Aggregate boundaries follow transactional consistency needs, not the convenience of grouping
  things together.
- The aggregate root is the only entry point and the consistency keeper — never create or mutate a
  child entity from outside the aggregate.
- Never navigate between aggregates directly — cross-aggregate references are foreign-key IDs
  only. Never add a Prisma `relation`/`include` in `schema.prisma` that crosses an aggregate
  boundary; load the other aggregate through its own repository.
- Extending the `AggregateRoot` base class (`domain/common/aggregate-root.base.ts`) is enough to
  mark an aggregate root — do not add a separate marker interface for it.
- The domain never references Prisma/`@prisma/client` or any ORM (Persistence Ignorance).

## Value Object

- No identity; immutable; compared by value, not by reference.
- Equality always goes through the explicit `.equals(other)` method on the `ValueObject` base
  class — never `===`.
- Never mutate after construction — all fields `readonly`; build a new instance instead of
  mutating in place (`Colour.fromPersistence(...)`).
- How a value object is stored (flattened into the parent table's columns, or a JSON column) is
  decided per value object in its own `.mapper.ts`, not fixed project-wide.

## Enum vs Enumeration

- Plain `enum` for small, closed, static sets of values.
- Driving complex logic/behaviour off an `enum` is a smell — model it as a small class with
  behaviour instead, and only when actually needed.
- A string literal union (`type Status = 'draft' | 'published'`) is an acceptable alternative to
  `enum` for simple closed sets — pick whichever reads better for that specific field.

## Invariant & validation

- Invariants are enforced by the entity itself (constructor/methods) — an entity must never exist
  in an invalid state. Throw on violation, and never leave a half-applied mutation behind before
  throwing.
- Domain exceptions guard invariants (things that must never happen); expected business outcomes
  use `Result<T>` (`shared-kernel`) instead.
- Field-level validation lives on the `api/` request DTOs (`class-validator` decorators), enforced
  by the global `ValidationPipe` before the command is even constructed — never hand-call a
  separate validator class inside a command handler. Entity invariants are the last line of
  defence for states that should already be impossible by then.

## CQRS: queries bypass aggregates

- Aggregate boundaries apply to writes only. Queries bypass them entirely — one query DTO may join
  data across several aggregates/tables through the read port's Prisma query.

## Domain event

- Never write to the DB from an `@EventsHandler` — it runs outside the caller's transaction.
  Anything that must not be lost goes through the outbox; `EventBus` is best-effort only.
- The outbox's on-the-wire `type` comes from `event.constructor.name` — a bundler/minifier that
  renames classes silently renames every exchange.
- Handlers live in the Application layer, never in Domain.
- One event → zero or more handlers. With two or more, name each after the action it performs, not
  after the event: `<action>-when-<event>.domain-event-handler.ts`.

## Repository — one per aggregate root

- Exactly one repository per aggregate root — never one per table/child entity.
- The repository is the **only** write channel: a command handler loads the aggregate through
  `I<Aggregate>Repository`, mutates it through its own methods, and never commits itself.
- A repository implementation supplies only the persistence-specific reads/writes for its own
  aggregate; it never opens or commits a transaction itself, and never skips a step in the
  surrounding transaction/outbox/publish chain — that chain is fixed once, centrally
  (`AggregateRepositoryBase`), not re-implemented per repository. Transaction scope is per
  aggregate — never widen a repository to touch more than the one aggregate it owns.
- Queries bypass repositories entirely — reads go through a read port (CQRS), never a repository.
