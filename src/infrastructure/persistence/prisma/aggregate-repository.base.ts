import { Inject } from '@nestjs/common';
import { Transaction, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { AggregateRoot } from '@domain/common/aggregate-root.base';
import { Repository } from '@domain/common/repository.interface';
import { DomainEventDispatcher } from '@application/common/domain-event/domain-event-dispatcher';
import { PrismaClientExtended } from './prisma-client.factory';

export type PrismaAdapter = TransactionalAdapterPrisma<PrismaClientExtended>;
export type PrismaContext = Transaction<PrismaAdapter>;

// Property injection, not constructor: every concrete repository would otherwise have to
// declare a constructor purely to forward these along.
export abstract class AggregateRepositoryBase<T extends AggregateRoot<unknown>> implements Repository<T> {
  @Inject()
  private readonly txHost!: TransactionHost<PrismaAdapter>;

  @Inject()
  private readonly dispatcher!: DomainEventDispatcher;

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

  // Joins the transaction the command dispatcher opened; it never opens one, so a write
  // that gets here unscoped would otherwise land on the non-transactional client.
  private async commit(aggregate: T, write: (db: PrismaContext) => Promise<void>): Promise<void> {
    if (!this.txHost.isTransactionActive()) {
      throw new Error(
        `${aggregate.constructor.name} ${String(aggregate.id)} was written with no transaction open — ` +
          'send the command through COMMAND_DISPATCHER.',
      );
    }

    await write(this.txHost.tx);

    const events = aggregate.getUncommittedEvents();
    aggregate.clearUncommittedEvents();
    await this.dispatcher.dispatch(events);

    if (aggregate.hasUncommittedEvents) {
      throw new Error(
        `A handler mutated ${aggregate.constructor.name} ${String(aggregate.id)} after it had been written, ` +
          'so that change was never persisted.',
      );
    }
  }
}
