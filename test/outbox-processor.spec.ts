import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SharedKernelModule } from '@infrastructure/common/shared-kernel.module';
import { IntegrationEventPublisher } from '@infrastructure/outbox/integration-event-publisher.interface';
import { INTEGRATION_EVENT_PUBLISHER } from '@infrastructure/outbox/outbox.di-tokens';
import { OutboxProcessor } from '@infrastructure/outbox/outbox.processor';
import databaseConfig from '@infrastructure/persistence/prisma/database.config';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';

class FakePublisher implements IntegrationEventPublisher {
  readonly published: { eventType: string; content: string }[] = [];
  failWith: Error | null = null;

  async publish(eventType: string, content: string): Promise<void> {
    if (this.failWith) {
      throw this.failWith;
    }
    this.published.push({ eventType, content });
  }
}

describe('OutboxProcessor', () => {
  let moduleRef: TestingModule;
  let processor: OutboxProcessor;
  let prisma: PrismaClientExtended;
  let publisher: FakePublisher;

  const seed = (id: string, occurredOn: Date, type = 'TodoItemCompleted') =>
    prisma.outboxMessage.create({
      data: { id, type, content: JSON.stringify({ name: type, id }), occurredOn },
    });

  beforeAll(async () => {
    publisher = new FakePublisher();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }), SharedKernelModule, PrismaModule],
      providers: [OutboxProcessor, { provide: INTEGRATION_EVENT_PUBLISHER, useValue: publisher }],
    }).compile();
    await moduleRef.init();

    processor = moduleRef.get(OutboxProcessor);
    prisma = moduleRef.get<PrismaClientExtended>(PRISMA_CLIENT);
  });

  beforeEach(async () => {
    publisher.published.length = 0;
    publisher.failWith = null;
    await prisma.outboxMessage.deleteMany();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('publishes pending messages and marks them processed', async () => {
    await seed('ob-1', new Date());

    await processor.process();

    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0].eventType).toBe('TodoItemCompleted');
    const [message] = await prisma.outboxMessage.findMany();
    expect(message.processedOn).not.toBeNull();
    expect(message.error).toBeNull();
  });

  it('publishes oldest first', async () => {
    await seed('ob-new', new Date('2026-01-02T00:00:00Z'), 'Second');
    await seed('ob-old', new Date('2026-01-01T00:00:00Z'), 'First');

    await processor.process();

    expect(publisher.published.map((message) => message.eventType)).toEqual(['First', 'Second']);
  });

  it('leaves a failed message unprocessed and records why', async () => {
    await seed('ob-1', new Date());
    publisher.failWith = new Error('broker unreachable');

    await processor.process();

    const [message] = await prisma.outboxMessage.findMany();
    expect(message.processedOn).toBeNull();
    expect(message.error).toBe('broker unreachable');
  });

  it('retries a previously failed message on the next cycle', async () => {
    await seed('ob-1', new Date());
    publisher.failWith = new Error('broker unreachable');
    await processor.process();

    publisher.failWith = null;
    await processor.process();

    expect(publisher.published).toHaveLength(1);
    const [message] = await prisma.outboxMessage.findMany();
    expect(message.processedOn).not.toBeNull();
  });

  it('never republishes an already processed message', async () => {
    await seed('ob-1', new Date());
    await processor.process();

    await processor.process();

    expect(publisher.published).toHaveLength(1);
  });

  it('survives a broker outage without throwing out of the timer callback', async () => {
    await seed('ob-1', new Date());
    publisher.failWith = new Error('broker unreachable');

    await expect(processor.process()).resolves.toBeUndefined();
  });

  describe('retry policy', () => {
    it('counts an attempt and schedules the next one in the future', async () => {
      await seed('ob-1', new Date());
      publisher.failWith = new Error('broker unreachable');

      await processor.process();

      const [message] = await prisma.outboxMessage.findMany();
      expect(message.attempts).toBe(1);
      expect(message.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('does not retry before the backoff deadline', async () => {
      // Start from a high attempt count so the backoff is tens of seconds — long
      // enough that this assertion cannot depend on how fast the test runs.
      await prisma.outboxMessage.create({
        data: { id: 'ob-1', type: 'TodoItemCompleted', content: '{}', occurredOn: new Date(), attempts: 5 },
      });
      publisher.failWith = new Error('broker unreachable');
      await processor.process();

      publisher.failWith = null;
      await processor.process();

      expect(publisher.published).toHaveLength(0);
    });

    it('gives up after the attempt limit and leaves a dead letter behind', async () => {
      await prisma.outboxMessage.create({
        data: {
          id: 'ob-dead',
          type: 'TodoItemCompleted',
          content: '{}',
          occurredOn: new Date(),
          attempts: 8,
          error: 'broker unreachable',
        },
      });

      await processor.process();

      expect(publisher.published).toHaveLength(0);
      const [message] = await prisma.outboxMessage.findMany();
      expect(message.processedOn).toBeNull();
      expect(message.error).toBe('broker unreachable');
    });
  });

  describe('multiple replicas', () => {
    it('never hands the same message to two concurrent cycles', async () => {
      for (let index = 0; index < 10; index += 1) {
        await seed(`ob-${index}`, new Date(Date.now() + index));
      }

      await Promise.all([processor.process(), processor.process(), processor.process()]);

      const publishedIds = publisher.published.map((message) => message.content);
      expect(new Set(publishedIds).size).toBe(publishedIds.length);
      expect(await prisma.outboxMessage.count({ where: { processedOn: null } })).toBe(0);
    });
  });
});
