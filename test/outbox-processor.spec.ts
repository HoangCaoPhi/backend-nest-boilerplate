import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { SharedKernelModule } from '@shared-kernel/shared-kernel.module';
import { IntegrationEventPublisher } from '@infrastructure/integration-event/integration-event-publisher.interface';
import { INTEGRATION_EVENT_PUBLISHER } from '@infrastructure/integration-event/integration-event.di-tokens';
import { OutboxProcessor } from '@infrastructure/outbox/outbox-processor';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';

class FakePublisher implements IntegrationEventPublisher {
  readonly published: { eventType: string; content: string }[] = [];
  failWith: Error | null = null;
  beforePublish: (() => Promise<void>) | null = null;

  async publish(eventType: string, content: string): Promise<void> {
    await this.beforePublish?.();
    if (this.failWith) {
      throw this.failWith;
    }
    this.published.push({ eventType, content });
  }
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe('OutboxProcessor', () => {
  let moduleRef: TestingModule;
  let processor: OutboxProcessor;
  let prisma: PrismaClientExtended;
  const publisher = new FakePublisher();

  const seed = (id: string, overrides: Record<string, unknown> = {}) =>
    prisma.outboxMessage.create({
      data: {
        id,
        type: 'TodoItemCompletedIntegrationEvent',
        content: JSON.stringify({ todoItemId: id }),
        occurredOn: new Date(),
        ...overrides,
      },
    });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        InfrastructureModule,
        SharedKernelModule,
        PrismaModule,
        ClsModule.forRoot({
          global: true,
          plugins: [
            new ClsPluginTransactional({
              adapter: new TransactionalAdapterPrisma<PrismaClientExtended>({
                prismaInjectionToken: PRISMA_CLIENT,
              }),
              enableTransactionProxy: true,
            }),
          ],
        }),
      ],
      providers: [OutboxProcessor, { provide: INTEGRATION_EVENT_PUBLISHER, useValue: publisher }],
    }).compile();
    await moduleRef.init();

    processor = moduleRef.get(OutboxProcessor);
    prisma = moduleRef.get<PrismaClientExtended>(PRISMA_CLIENT);
  });

  beforeEach(async () => {
    publisher.published.length = 0;
    publisher.failWith = null;
    publisher.beforePublish = null;
    await prisma.outboxMessage.deleteMany();
  });

  afterAll(async () => {
    await prisma.outboxMessage.deleteMany();
    await moduleRef.close();
  });

  it('publishes a pending message and marks it processed', async () => {
    await seed('ob-1');

    await processor.process();

    expect(publisher.published).toEqual([
      { eventType: 'TodoItemCompletedIntegrationEvent', content: JSON.stringify({ todoItemId: 'ob-1' }) },
    ]);
    const [row] = await prisma.outboxMessage.findMany();
    expect(row.processedOn).not.toBeNull();
    expect(row.error).toBeNull();
  });

  it('publishes oldest first', async () => {
    await seed('ob-late', { occurredOn: new Date('2026-02-01') });
    await seed('ob-early', { occurredOn: new Date('2026-01-01') });

    await processor.process();

    expect(publisher.published.map((message) => JSON.parse(message.content).todoItemId)).toEqual([
      'ob-early',
      'ob-late',
    ]);
  });

  it('leaves an already processed message alone', async () => {
    await seed('ob-done', { processedOn: new Date() });

    await processor.process();

    expect(publisher.published).toHaveLength(0);
  });

  describe('when publishing fails', () => {
    it('records the reason and keeps the message pending', async () => {
      await seed('ob-fail');
      publisher.failWith = new Error('broker unreachable');

      await processor.process();

      const [row] = await prisma.outboxMessage.findMany();
      expect(row.processedOn).toBeNull();
      expect(row.error).toBe('broker unreachable');
    });

    it('counts the attempt and pushes the next one into the future', async () => {
      await seed('ob-fail');
      publisher.failWith = new Error('broker unreachable');

      await processor.process();

      const [row] = await prisma.outboxMessage.findMany();
      expect(row.attempts).toBe(1);
      expect(row.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('does not throw out of the cycle, so the timer survives', async () => {
      await seed('ob-fail');
      publisher.failWith = new Error('broker unreachable');

      await expect(processor.process()).resolves.toBeUndefined();
    });

    it('publishes the message once its backoff has passed', async () => {
      await seed('ob-retry', { attempts: 1, nextAttemptAt: new Date(Date.now() - 1000) });

      await processor.process();

      expect(publisher.published).toHaveLength(1);
      const [row] = await prisma.outboxMessage.findMany();
      expect(row.processedOn).not.toBeNull();
    });
  });

  it('skips a message that is still backing off', async () => {
    await seed('ob-waiting', { attempts: 1, nextAttemptAt: new Date(Date.now() + 60_000) });

    await processor.process();

    expect(publisher.published).toHaveLength(0);
  });

  // Past the attempt ceiling a message stops being selected and stays as a dead letter.
  it('gives up on a message that exhausted its attempts', async () => {
    await seed('ob-dead', { attempts: 8, error: 'broker unreachable' });

    await processor.process();

    expect(publisher.published).toHaveLength(0);
    const [row] = await prisma.outboxMessage.findMany();
    expect(row.attempts).toBe(8);
    expect(row.processedOn).toBeNull();
  });

  // The row lock is the lease. The wait matters: an implementation that claims with an
  // autocommitted UPDATE and relies on a retry delay instead of a lock hands the message to
  // the second cycle as soon as that delay passes, and publishes it twice.
  it('skips a message another cycle is still publishing', async () => {
    await seed('ob-inflight');
    const started = deferred();
    const blocked = deferred();
    publisher.beforePublish = async () => {
      started.resolve();
      await blocked.promise;
    };

    const firstCycle = processor.process();
    await started.promise;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await processor.process();

    blocked.resolve();
    await firstCycle;

    expect(publisher.published).toHaveLength(1);
  });
});
