import { TestingModule } from '@nestjs/testing';
import { COMMAND_DISPATCHER } from '@application/common/message/command-dispatcher.di-tokens';
import { CommandDispatcher } from '@application/common/message/command-dispatcher.interface';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';
import { createTestModule } from './create-test-module';
import {
  AddBothProbesCommand,
  AddBothProbesCommandHandler,
  AddProbeAndNoteCommand,
  AddProbeAndNoteCommandHandler,
  CREATE_PROBE_NOTE_TABLE,
  CREATE_PROBE_TABLE,
  CREATE_PROBE_TOUCH_TABLE,
  Probe,
  ProbeNote,
  ProbeNoteRepository,
  ProbeRepository,
  PublishTouchWhenProbeTouched,
  RecordTouchHandler,
} from './probe';

describe('Unit of work', () => {
  let moduleRef: TestingModule;
  let commands: CommandDispatcher;
  let handler: RecordTouchHandler;
  let prisma: PrismaClientExtended;
  let counter = 0;

  const nextId = () => `uow-${(counter += 1)}`;
  const countIn = async (table: string) => {
    const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) AS count FROM ${table}`);
    return Number(count);
  };
  const touchedPair = () => {
    const first = new Probe(nextId(), 'first');
    const second = new Probe(nextId(), 'second');
    first.touch();
    second.touch();
    return [first, second] as const;
  };

  beforeAll(async () => {
    moduleRef = await createTestModule([
      ProbeRepository,
      ProbeNoteRepository,
      PublishTouchWhenProbeTouched,
      RecordTouchHandler,
      AddBothProbesCommandHandler,
      AddProbeAndNoteCommandHandler,
    ]);
    await moduleRef.init();

    commands = moduleRef.get(COMMAND_DISPATCHER);
    handler = moduleRef.get(RecordTouchHandler);
    prisma = moduleRef.get<PrismaClientExtended>(PRISMA_CLIENT);
    await prisma.$executeRawUnsafe(CREATE_PROBE_TABLE);
    await prisma.$executeRawUnsafe(CREATE_PROBE_TOUCH_TABLE);
    await prisma.$executeRawUnsafe(CREATE_PROBE_NOTE_TABLE);
  });

  beforeEach(async () => {
    handler.failOnProbeId = null;
    await prisma.$executeRaw`TRUNCATE probe`;
    await prisma.$executeRaw`TRUNCATE probe_touch`;
    await prisma.$executeRaw`TRUNCATE probe_note`;
    await prisma.outboxMessage.deleteMany();
  });

  afterAll(async () => {
    await prisma.$executeRaw`DROP TABLE IF EXISTS probe_note`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS probe_touch`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS probe`;
    await moduleRef.close();
  });

  describe('writes across aggregates', () => {
    // No handler here opens a transaction: the dispatcher is what makes these one unit.
    it('commits several writes made under one command', async () => {
      await commands.dispatch(new AddBothProbesCommand(new Probe(nextId(), 'first'), new Probe(nextId(), 'second')));

      expect(await countIn('probe')).toBe(2);
    });

    it('rolls every write back when the handler throws', async () => {
      const command = new AddBothProbesCommand(new Probe(nextId(), 'first'), new Probe(nextId(), 'second'), 'throw');

      await expect(commands.dispatch(command)).rejects.toThrow('command failed after both writes landed');

      expect(await countIn('probe')).toBe(0);
    });

    // Two repository instances, each with its own injected TransactionHost. This is what
    // proves they join the command's transaction instead of each opening one.
    it('commits writes made through two different repositories', async () => {
      await commands.dispatch(
        new AddProbeAndNoteCommand(new Probe(nextId(), 'first'), new ProbeNote(nextId(), 'note')),
      );

      expect(await countIn('probe')).toBe(1);
      expect(await countIn('probe_note')).toBe(1);
    });

    it('rolls both repositories back when the handler throws', async () => {
      const command = new AddProbeAndNoteCommand(new Probe(nextId(), 'first'), new ProbeNote(nextId(), 'note'), true);

      await expect(commands.dispatch(command)).rejects.toThrow('command failed after both aggregates landed');

      expect(await countIn('probe')).toBe(0);
      expect(await countIn('probe_note')).toBe(0);
    });

    // The sharpest one: the probe is already written and the failure comes from inside the
    // second repository's insert, not from the handler choosing to throw.
    it('rolls the first repository back when the second one fails mid-command', async () => {
      const takenId = nextId();
      await prisma.$executeRaw`INSERT INTO probe_note (id, body) VALUES (${takenId}, 'already here')`;

      const command = new AddProbeAndNoteCommand(new Probe(nextId(), 'first'), new ProbeNote(takenId, 'note'));

      await expect(commands.dispatch(command)).rejects.toThrow();

      expect(await countIn('probe')).toBe(0);
      expect(await countIn('probe_note')).toBe(1);
    });
  });

  describe('domain event handlers and the outbox', () => {
    it('commits the aggregates, the handler writes and the outbox rows together', async () => {
      const [first, second] = touchedPair();

      await commands.dispatch(new AddBothProbesCommand(first, second));

      expect(await countIn('probe')).toBe(2);
      expect(await countIn('probe_touch')).toBe(2);
      expect(await prisma.outboxMessage.count()).toBe(2);
    });

    it('rolls the handler writes and the outbox rows back with the command', async () => {
      const [first, second] = touchedPair();

      await expect(commands.dispatch(new AddBothProbesCommand(first, second, 'throw'))).rejects.toThrow();

      expect(await countIn('probe')).toBe(0);
      expect(await countIn('probe_touch')).toBe(0);
      expect(await prisma.outboxMessage.count()).toBe(0);
    });

    // The first aggregate is already written and its own handler has already run when the
    // second aggregate's handler refuses. One transaction spans it all, so none of it survives.
    it('rolls back the first aggregate when the second aggregate handler refuses', async () => {
      const [first, second] = touchedPair();
      handler.failOnProbeId = second.id;

      await expect(commands.dispatch(new AddBothProbesCommand(first, second))).rejects.toThrow(
        `handler refused ${second.id}`,
      );

      expect(await countIn('probe')).toBe(0);
      expect(await countIn('probe_touch')).toBe(0);
      expect(await prisma.outboxMessage.count()).toBe(0);
    });
  });

  // A rejected Result is an expected business outcome, not a failure of the writes that
  // preceded it, so the rows stay.
  it('keeps the writes when the handler answers with a failed Result', async () => {
    const command = new AddBothProbesCommand(new Probe(nextId(), 'first'), new Probe(nextId(), 'second'), 'reject');

    const result = await commands.dispatch(command);

    expect(result.isFailure).toBe(true);
    expect(await countIn('probe')).toBe(2);
  });
});
