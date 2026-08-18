import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TimeProvider } from '@shared-kernel/time-provider/time-provider.interface';
import { TIME_PROVIDER } from '@shared-kernel/time-provider/time-provider.di-tokens';
import { PrismaClientExtended } from '../persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '../persistence/prisma/prisma.di-tokens';
import { IntegrationEventPublisher } from './integration-event-publisher.interface';
import { INTEGRATION_EVENT_PUBLISHER } from './outbox.di-tokens';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 8;
const MAX_BACKOFF_SECONDS = 300;

interface ClaimedMessage {
  id: string;
  type: string;
  content: string;
}

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClientExtended,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly publisher: IntegrationEventPublisher,
    @Inject(TIME_PROVIDER)
    private readonly timeProvider: TimeProvider,
  ) {}

  @Interval(5000)
  async process(): Promise<void> {
    try {
      await this.processBatch();
    } catch (error) {
      // A broker or database outage must kill only this cycle, not the timer.
      this.logger.error('Outbox processing cycle failed', error);
    }
  }

  private async processBatch(): Promise<void> {
    const messages = await this.claimBatch();

    for (const message of messages) {
      try {
        await this.publisher.publish(message.type, message.content);
        await this.prisma.outboxMessage.update({
          where: { id: message.id },
          data: { processedOn: this.timeProvider.now(), error: null },
        });
      } catch (error) {
        // attempts and the backoff deadline were already written by the claim,
        // so a crash between here and there still counts as one attempt.
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to publish outbox message ${message.id}`, error);
        await this.prisma.outboxMessage.update({ where: { id: message.id }, data: { error: reason } });
      }
    }
  }

  // Claims work atomically: SKIP LOCKED lets other replicas take different rows instead
  // of blocking on ours, and the lease (nextAttemptAt) keeps a crashed claim from being
  // retried immediately. Messages past MAX_ATTEMPTS stop being selected — they stay in
  // the table as dead letters with their last error.
  private claimBatch(): Promise<ClaimedMessage[]> {
    return this.prisma.$queryRaw<ClaimedMessage[]>`
      UPDATE outbox_messages
      SET attempts = attempts + 1,
          "nextAttemptAt" = now() + make_interval(
            secs => least(power(2, attempts)::int, ${MAX_BACKOFF_SECONDS}::int)
          )
      WHERE id IN (
        SELECT id FROM outbox_messages
        WHERE "processedOn" IS NULL
          AND attempts < ${MAX_ATTEMPTS}::int
          AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now())
        ORDER BY "occurredOn"
        LIMIT ${BATCH_SIZE}::int
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, type, content;
    `;
  }
}
