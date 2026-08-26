import { AggregateRoot } from './aggregate-root.base';
import { DomainEvent } from './domain-event.interface';

class TableOpened implements DomainEvent {
  readonly occurredOn = new Date(0);
}

class TableClosed implements DomainEvent {
  readonly occurredOn = new Date(0);
}

class Table extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }

  open(): void {
    this.addDomainEvent(new TableOpened());
  }

  close(): void {
    this.addDomainEvent(new TableClosed());
  }
}

describe('AggregateRoot', () => {
  it('starts with no domain events', () => {
    expect(new Table('1').getUncommittedEvents()).toEqual([]);
  });

  it('records events in the order they happened', () => {
    const table = new Table('1');
    table.open();
    table.close();

    expect(table.getUncommittedEvents().map((event) => event.constructor.name)).toEqual(['TableOpened', 'TableClosed']);
  });

  it('keeps the events until they are cleared', () => {
    const table = new Table('1');
    table.open();

    expect(table.getUncommittedEvents()).toHaveLength(1);
    expect(table.getUncommittedEvents()).toHaveLength(1);
  });

  it('has nothing left once cleared', () => {
    const table = new Table('1');
    table.open();

    table.clearUncommittedEvents();

    expect(table.getUncommittedEvents()).toEqual([]);
  });

  it('hands out a copy, so clearing does not empty what a caller already took', () => {
    const table = new Table('1');
    table.open();

    const taken = table.getUncommittedEvents();
    table.clearUncommittedEvents();

    expect(taken).toHaveLength(1);
  });

  it('collects events raised after an earlier clear', () => {
    const table = new Table('1');
    table.open();
    table.clearUncommittedEvents();
    table.close();

    expect(table.getUncommittedEvents().map((event) => event.constructor.name)).toEqual(['TableClosed']);
  });
});
