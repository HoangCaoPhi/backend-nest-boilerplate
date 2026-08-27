import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionHost } from '@nestjs-cls/transactional';
import { AggregateRoot } from '@domain/common/aggregate-root.base';
import { DomainEvent } from '@domain/common/domain-event.interface';
import { DomainEventHandler } from '@application/common/domain-event/domain-event-handler';
import { IntegrationEvent } from '@application/common/integration-event/integration-event.interface';
import { Command } from '@application/common/message/command.base';
import { IntegrationEventOutbox } from '@application/common/outbox/integration-event-outbox.interface';
import { INTEGRATION_EVENT_OUTBOX } from '@application/common/outbox/outbox.di-tokens';
import { AppError } from '@shared-kernel/result/error';
import { Result } from '@shared-kernel/result/result';
import {
  AggregateRepositoryBase,
  PrismaAdapter,
  PrismaContext,
} from '@infrastructure/persistence/prisma/aggregate-repository.base';

// Scratch tables stand in for real aggregate tables: these suites are about the transaction
// and event chain around a command, not about any one aggregate mapping.
export const CREATE_PROBE_TABLE = 'CREATE TABLE IF NOT EXISTS probe (id text PRIMARY KEY, label text NOT NULL)';
export const CREATE_PROBE_TOUCH_TABLE = 'CREATE TABLE IF NOT EXISTS probe_touch (probe_id text NOT NULL)';
export const CREATE_PROBE_NOTE_TABLE =
  'CREATE TABLE IF NOT EXISTS probe_note (id text PRIMARY KEY, body text NOT NULL)';

export class ProbeTouched implements DomainEvent {
  readonly occurredOn = new Date(0);

  constructor(readonly probeId: string) {}
}

export class ProbeTouchedIntegrationEvent implements IntegrationEvent {
  constructor(
    readonly probeId: string,
    readonly occurredOn: Date,
  ) {}
}

export class Probe extends AggregateRoot<string> {
  constructor(
    id: string,
    readonly label: string,
  ) {
    super(id);
  }

  touch(): void {
    this.addDomainEvent(new ProbeTouched(this.id));
  }
}

export class ProbeNote extends AggregateRoot<string> {
  constructor(
    id: string,
    readonly body: string,
  ) {
    super(id);
  }
}

@Injectable()
export class ProbeRepository extends AggregateRepositoryBase<Probe> {
  protected async find(db: PrismaContext, id: string): Promise<Probe | null> {
    const rows = await db.$queryRaw<{ id: string; label: string }[]>`SELECT id, label FROM probe WHERE id = ${id}`;
    return rows.length > 0 ? new Probe(rows[0].id, rows[0].label) : null;
  }

  protected async insert(db: PrismaContext, probe: Probe): Promise<void> {
    await db.$executeRaw`INSERT INTO probe (id, label) VALUES (${probe.id}, ${probe.label})`;
  }

  protected async modify(db: PrismaContext, probe: Probe): Promise<void> {
    await db.$executeRaw`UPDATE probe SET label = ${probe.label} WHERE id = ${probe.id}`;
  }

  protected async remove(db: PrismaContext, probe: Probe): Promise<void> {
    await db.$executeRaw`DELETE FROM probe WHERE id = ${probe.id}`;
  }
}

// A second aggregate with its own repository instance: the two-repository suites need two
// separately injected TransactionHosts, not two methods on one repository.
@Injectable()
export class ProbeNoteRepository extends AggregateRepositoryBase<ProbeNote> {
  protected async find(db: PrismaContext, id: string): Promise<ProbeNote | null> {
    const rows = await db.$queryRaw<{ id: string; body: string }[]>`SELECT id, body FROM probe_note WHERE id = ${id}`;
    return rows.length > 0 ? new ProbeNote(rows[0].id, rows[0].body) : null;
  }

  protected async insert(db: PrismaContext, note: ProbeNote): Promise<void> {
    await db.$executeRaw`INSERT INTO probe_note (id, body) VALUES (${note.id}, ${note.body})`;
  }

  protected async modify(db: PrismaContext, note: ProbeNote): Promise<void> {
    await db.$executeRaw`UPDATE probe_note SET body = ${note.body} WHERE id = ${note.id}`;
  }

  protected async remove(db: PrismaContext, note: ProbeNote): Promise<void> {
    await db.$executeRaw`DELETE FROM probe_note WHERE id = ${note.id}`;
  }
}

@Injectable()
@DomainEventHandler(ProbeTouched)
export class PublishTouchWhenProbeTouched implements DomainEventHandler<ProbeTouched> {
  constructor(
    @Inject(INTEGRATION_EVENT_OUTBOX)
    private readonly outbox: IntegrationEventOutbox,
  ) {}

  async handle(event: ProbeTouched): Promise<void> {
    await this.outbox.enqueue([new ProbeTouchedIntegrationEvent(event.probeId, event.occurredOn)]);
  }
}

// Writes through txHost.tx on purpose: if the dispatcher ran outside the command's
// transaction, this row would survive a rollback.
@Injectable()
@DomainEventHandler(ProbeTouched)
export class RecordTouchHandler implements DomainEventHandler<ProbeTouched> {
  failOnProbeId: string | null = null;

  constructor(private readonly txHost: TransactionHost<PrismaAdapter>) {}

  async handle(event: ProbeTouched): Promise<void> {
    if (this.failOnProbeId === event.probeId) {
      throw new Error(`handler refused ${event.probeId}`);
    }

    await this.txHost.tx.$executeRaw`INSERT INTO probe_touch (probe_id) VALUES (${event.probeId})`;
  }
}

// Asks for no transaction of its own: whatever commits or rolls back is what the command
// dispatcher wrapped around it.
export class AddBothProbesCommand extends Command {
  constructor(
    readonly first: Probe,
    readonly second: Probe,
    readonly outcome: 'ok' | 'throw' | 'reject' = 'ok',
  ) {
    super();
  }
}

@CommandHandler(AddBothProbesCommand)
export class AddBothProbesCommandHandler implements ICommandHandler<AddBothProbesCommand, Result<void>> {
  constructor(private readonly repository: ProbeRepository) {}

  async execute(command: AddBothProbesCommand): Promise<Result<void>> {
    await this.repository.add(command.first);
    await this.repository.add(command.second);

    if (command.outcome === 'throw') {
      throw new Error('command failed after both writes landed');
    }
    if (command.outcome === 'reject') {
      return Result.fail(AppError.conflict('Probe.AlreadyEntered', 'already entered this probe'));
    }

    return Result.ok();
  }
}

export class AddProbeAndNoteCommand extends Command {
  constructor(
    readonly probe: Probe,
    readonly note: ProbeNote,
    readonly thenFail = false,
  ) {
    super();
  }
}

@CommandHandler(AddProbeAndNoteCommand)
export class AddProbeAndNoteCommandHandler implements ICommandHandler<AddProbeAndNoteCommand, Result<void>> {
  constructor(
    private readonly probes: ProbeRepository,
    private readonly notes: ProbeNoteRepository,
  ) {}

  async execute(command: AddProbeAndNoteCommand): Promise<Result<void>> {
    await this.probes.add(command.probe);
    await this.notes.add(command.note);

    if (command.thenFail) {
      throw new Error('command failed after both aggregates landed');
    }

    return Result.ok();
  }
}
