import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TimeProvider } from '@shared-kernel/time-provider/time-provider.interface';
import { TIME_PROVIDER } from '@shared-kernel/time-provider/time-provider.di-tokens';
import { PrismaAdapter } from '../persistence/prisma/aggregate-repository.base';
import { IntegrationEventPublisher } from '../integration-event/integration-event-publisher.interface';
import { INTEGRATION_EVENT_PUBLISHER } from '../integration-event/integration-event.di-tokens';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 8;
const MAX_BACKOFF_SECONDS = 300;
const PUBLISH_TIMEOUT_MS = 30_000;

interface ClaimedMessage {
  id: string;
  type: string;
  content: string;
  attempts: number;
}

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly txHost: TransactionHost<PrismaAdapter>,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly publisher: IntegrationEventPublisher,
    @Inject(TIME_PROVIDER)
    private readonly timeProvider: TimeProvider,
  ) {}

  @Interval(5000)
  async process(): Promise<void> {
    try {
      for (let taken = 0; taken < BATCH_SIZE; taken += 1) {
        if (!(await this.processNext())) {
          return;
        }
      }
    } catch (error) {
      // A broker or database outage must kill only this cycle, not the timer.
      this.logger.error('Outbox processing cycle failed', error);
    }
  }

  // One message per transaction, with the row lock held across the publish: another replica
  // cannot take the same row while it is in flight, so the lease needs no separate deadline.
  private processNext(): Promise<boolean> {
    return this.txHost.withTransaction({ timeout: PUBLISH_TIMEOUT_MS }, async () => {
      const message = await this.claim();
      if (!message) {
        return false;
      }

      try {
        await this.publisher.publish(message.type, message.content);
        await this.txHost.tx.outboxMessage.update({
          where: { id: message.id },
          data: { attempts: message.attempts + 1, processedOn: this.timeProvider.now(), error: null },
        });
      } catch (error) {
        this.logger.error(`Failed to publish outbox message ${message.id}`, error);
        await this.txHost.tx.outboxMessage.update({
          where: { id: message.id },
          data: {
            attempts: message.attempts + 1,
            error: error instanceof Error ? error.message : String(error),
            nextAttemptAt: this.backoffFrom(message.attempts),
          },
        });
      }

      return true;
    });
  }

  private async claim(): Promise<ClaimedMessage | undefined> {
    const [message] = await this.txHost.tx.$queryRaw<ClaimedMessage[]>`
      SELECT id, type, content, attempts
        FROM outbox_messages
       WHERE "processedOn" IS NULL
         AND attempts < ${MAX_ATTEMPTS}::int
         AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now())
       ORDER BY "occurredOn", id
       LIMIT 1
         FOR UPDATE SKIP LOCKED
    `;
    return message;
  }

  private backoffFrom(attempts: number): Date {
    const seconds = Math.min(2 ** attempts, MAX_BACKOFF_SECONDS);
    return new Date(this.timeProvider.now().getTime() + seconds * 1000);
  }
}
