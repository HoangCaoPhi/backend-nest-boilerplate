import { TestingModule } from '@nestjs/testing';
import { Colour } from '@domain/todo-lists/colour.value-object';
import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';
import { TodoItem } from '@domain/todo-lists/todo-item.entity';
import { TodoList } from '@domain/todo-lists/todo-list.entity';
import { TodoListRepository } from '@domain/todo-lists/todo-list.repository.interface';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';
import { createTestModule } from './create-test-module';
import { FailingDomainEventHandler } from './failing-domain-event-handler';

describe('Unit of work (AggregateRepositoryBase)', () => {
  let moduleRef: TestingModule;
  let repository: TodoListRepository;
  let prisma: PrismaClientExtended;
  let failingHandler: FailingDomainEventHandler;

  const newList = (title = 'Groceries') => TodoList.create(crypto.randomUUID(), title, Colour.create('#FF0000'));

  beforeAll(async () => {
    moduleRef = await createTestModule();
    await moduleRef.init();

    repository = moduleRef.get<TodoListRepository>(TODO_LIST_REPOSITORY);
    prisma = moduleRef.get<PrismaClientExtended>(PRISMA_CLIENT);
    failingHandler = moduleRef.get(FailingDomainEventHandler);
  });

  beforeEach(async () => {
    failingHandler.failWith = null;
    await prisma.outboxMessage.deleteMany();
    await prisma.todoItem.deleteMany();
    await prisma.todoList.deleteMany();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('add', () => {
    it('persists the aggregate with its children', async () => {
      const todoList = newList();
      todoList.addItem(TodoItem.create(crypto.randomUUID(), 'Bread', PriorityLevel.High));

      await repository.add(todoList);

      const stored = await prisma.todoList.findUnique({
        where: { id: todoList.id },
        include: { items: true },
      });
      expect(stored).toMatchObject({ title: 'Groceries', colourCode: '#FF0000' });
      expect(stored!.items).toHaveLength(1);
      expect(stored!.items[0]).toMatchObject({ title: 'Bread', priority: 'High', isDone: false });
    });

    it('writes no outbox row when the aggregate raised no events', async () => {
      await repository.add(newList());

      expect(await prisma.outboxMessage.count()).toBe(0);
    });
  });

  describe('getById', () => {
    it('round-trips through the mapper back into a domain aggregate', async () => {
      const todoList = newList('Reading list');
      todoList.addItem(TodoItem.create(crypto.randomUUID(), 'Dune', PriorityLevel.Medium));
      await repository.add(todoList);

      const loaded = await repository.getById(todoList.id);

      expect(loaded).toBeInstanceOf(TodoList);
      expect(loaded!.title).toBe('Reading list');
      expect(loaded!.colour.equals(Colour.create('#FF0000'))).toBe(true);
      expect(loaded!.items).toHaveLength(1);
      expect(loaded!.items[0]).toBeInstanceOf(TodoItem);
      expect(loaded!.items[0].priority).toBe(PriorityLevel.Medium);
    });

    it('returns null for an unknown id', async () => {
      expect(await repository.getById(crypto.randomUUID())).toBeNull();
    });
  });

  describe('update with domain events', () => {
    it('commits the write and the outbox row together', async () => {
      const todoList = newList();
      const item = TodoItem.create(crypto.randomUUID(), 'Bread');
      todoList.addItem(item);
      await repository.add(todoList);

      const loaded = (await repository.getById(todoList.id))!;
      loaded.completeItem(item.id);
      await repository.update(loaded);

      const [storedItem, outbox] = await Promise.all([
        prisma.todoItem.findUnique({ where: { id: item.id } }),
        prisma.outboxMessage.findMany(),
      ]);
      expect(storedItem!.isDone).toBe(true);
      expect(outbox).toHaveLength(1);
    });

    it('stores the integration event, not the internal domain event', async () => {
      const todoList = newList();
      const item = TodoItem.create(crypto.randomUUID(), 'Bread');
      todoList.addItem(item);
      await repository.add(todoList);

      const loaded = (await repository.getById(todoList.id))!;
      loaded.completeItem(item.id);
      await repository.update(loaded);

      const [message] = await prisma.outboxMessage.findMany();
      expect(message.type).toBe('TodoItemCompletedIntegrationEvent');
      expect(JSON.parse(message.content)).toMatchObject({
        todoListId: todoList.id,
        todoItemId: item.id,
      });
      expect(message.processedOn).toBeNull();
    });

    it('rolls the write back when a handler throws', async () => {
      const todoList = newList();
      const item = TodoItem.create(crypto.randomUUID(), 'Bread');
      todoList.addItem(item);
      await repository.add(todoList);

      const loaded = (await repository.getById(todoList.id))!;
      loaded.completeItem(item.id);
      failingHandler.failWith = new Error('handler blew up');

      await expect(repository.update(loaded)).rejects.toThrow('handler blew up');

      const storedItem = await prisma.todoItem.findUnique({ where: { id: item.id } });
      expect(storedItem!.isDone).toBe(false);
      expect(await prisma.outboxMessage.count()).toBe(0);
    });

    it('drains the aggregate so a second save cannot republish the same event', async () => {
      const todoList = newList();
      const item = TodoItem.create(crypto.randomUUID(), 'Bread');
      todoList.addItem(item);
      await repository.add(todoList);

      const loaded = (await repository.getById(todoList.id))!;
      loaded.completeItem(item.id);
      await repository.update(loaded);
      await repository.update(loaded);

      expect(await prisma.outboxMessage.count()).toBe(1);
    });

    it('removes items the aggregate no longer holds', async () => {
      const todoList = newList();
      const kept = TodoItem.create(crypto.randomUUID(), 'Bread');
      const dropped = TodoItem.create(crypto.randomUUID(), 'Milk');
      todoList.addItem(kept);
      todoList.addItem(dropped);
      await repository.add(todoList);

      const loaded = (await repository.getById(todoList.id))!;
      loaded.removeItem(dropped.id);
      await repository.update(loaded);

      const stored = await prisma.todoItem.findMany();
      expect(stored.map((item) => item.id)).toEqual([kept.id]);
    });
  });

  describe('rollback', () => {
    // Same id as an existing row, so the insert fails once the aggregate already
    // carries a pending domain event.
    const conflictingWith = (existingId: string) => {
      const duplicate = TodoList.create(existingId, 'Duplicate', Colour.white);
      const item = TodoItem.create(crypto.randomUUID(), 'Bread');
      duplicate.addItem(item);
      duplicate.completeItem(item.id);
      return duplicate;
    };

    it('writes neither the aggregate nor its outbox row when the write fails', async () => {
      const existing = newList();
      await repository.add(existing);

      await expect(repository.add(conflictingWith(existing.id))).rejects.toThrow();

      expect(await prisma.outboxMessage.count()).toBe(0);
      expect(await prisma.todoItem.count()).toBe(0);
      const stored = await prisma.todoList.findUnique({ where: { id: existing.id } });
      expect(stored!.title).toBe('Groceries');
    });

    it('leaves the events on the aggregate so the caller can retry', async () => {
      const existing = newList();
      await repository.add(existing);
      const duplicate = conflictingWith(existing.id);

      await expect(repository.add(duplicate)).rejects.toThrow();

      expect(duplicate.getUncommittedEvents()).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('removes the aggregate', async () => {
      const todoList = newList();
      await repository.add(todoList);

      await repository.delete(todoList);

      expect(await prisma.todoList.count()).toBe(0);
    });
  });
});
