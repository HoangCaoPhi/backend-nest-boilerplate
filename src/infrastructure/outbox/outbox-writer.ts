import { Inject, Injectable } from '@nestjs/common';
import { OutboxPayload } from '@application/common/outbox/outbox-payload.interface';
import { IdGenerator } from '@shared-kernel/id-generator/id-generator.interface';
import { ID_GENERATOR } from '@shared-kernel/id-generator/id-generator.di-tokens';
import { PrismaContext } from '../persistence/prisma/aggregate-repository.base';

// Rides the caller's open transaction — never opens or commits one itself.
@Injectable()
export class OutboxWriter {
  constructor(
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  async enqueue(db: PrismaContext, payloads: readonly OutboxPayload[]): Promise<void> {
    if (payloads.length === 0) {
      return;
    }

    await db.outboxMessage.createMany({
      data: payloads.map((payload) => ({
        id: this.idGenerator.generate(),
        // Wire type name comes from the class itself (mirrors .NET's GetType().Name) — safe only
        // because the production build is plain tsc, never a minifier that renames classes.
        type: payload.constructor.name,
        content: JSON.stringify(payload),
        occurredOn: payload.occurredOn,
      })),
    });
  }
}
