// Not OutboxMessage — that name collides with the Prisma OutboxMessage persisted row shape.
export interface OutboxPayload {
  readonly occurredOn: Date;
}
