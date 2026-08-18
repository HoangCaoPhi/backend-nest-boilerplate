import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Transaction, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { AggregateRoot } from '@domain/common/aggregate-root.base';
import { Repository } from '@domain/common/repository.interface';
import { OutboxPayloadSource } from '@application/common/outbox/outbox-payload-source.interface';
import { OUTBOX_PAYLOAD_SOURCE } from '@application/common/outbox/outbox.di-tokens';
import { OutboxWriter } from '../../outbox/outbox-writer';
import { PrismaClientExtended } from './prisma-client.factory';

export type PrismaAdapter = TransactionalAdapterPrisma<PrismaClientExtended>;
export type PrismaContext = Transaction<PrismaAdapter>;

export abstract class AggregateRepositoryBase<T extends AggregateRoot<unknown>> implements Repository<T> {
  @Inject()
  private readonly txHost!: TransactionHost<PrismaAdapter>;

  @Inject()
  private readonly eventBus!: EventBus;

  @Inject()
  private readonly outboxWriter!: OutboxWriter;

  @Inject(OUTBOX_PAYLOAD_SOURCE)
  private readonly outboxPayloads!: OutboxPayloadSource;

  protected abstract find(db: PrismaContext, id: string): Promise<T | null>;
  protected abstract insert(db: PrismaContext, aggregate: T): Promise<void>;
  protected abstract modify(db: PrismaContext, aggregate: T): Promise<void>;
  protected abstract remove(db: PrismaContext, aggregate: T): Promise<void>;

  async getById(id: string): Promise<T | null> {
    return this.find(this.txHost.tx, id);
  }

  async add(aggregate: T): Promise<void> {
    await this.commit(aggregate, (db) => this.insert(db, aggregate));
  }

  async update(aggregate: T): Promise<void> {
    await this.commit(aggregate, (db) => this.modify(db, aggregate));
  }

  async delete(aggregate: T): Promise<void> {
    await this.commit(aggregate, (db) => this.remove(db, aggregate));
  }

  private async commit(aggregate: T, write: (db: PrismaContext) => Promise<void>): Promise<void> {
    // Read without draining: if this transaction rolls back, the caller can retry
    // the same aggregate instance and its events are still there.
    const events = [...aggregate.domainEvents];

    await this.txHost.withTransaction(async () => {
      await write(this.txHost.tx);
      // Outbox row rides this transaction — it commits with the write or not at all.
      await this.outboxWriter.enqueue(this.txHost.tx, this.outboxPayloads.toOutboxPayloads(events));
    });

    // Past this line the transaction is committed, so in-process handlers can never
    // observe a write that was rolled back. They stay best-effort: @nestjs/cqrs
    // cannot await them, and a handler failure must not undo a committed write.
    aggregate.pullDomainEvents();
    this.eventBus.publishAll(events);
  }
}
