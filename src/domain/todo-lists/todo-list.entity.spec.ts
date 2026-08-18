import { Colour } from './colour.value-object';
import { TodoItemCompletedDomainEvent } from './events/todo-item-completed.domain-event';
import { PriorityLevel } from './priority-level.enum';
import { TodoItem } from './todo-item.entity';
import { TodoList } from './todo-list.entity';

describe('TodoList', () => {
  const newList = () => TodoList.create('list-1', 'Groceries', Colour.create('#FF0000'));

  it('rejects an empty title', () => {
    expect(() => TodoList.create('list-1', '   ')).toThrow();
  });

  it('defaults to white when no colour is given', () => {
    expect(TodoList.create('list-1', 'Groceries').colour.equals(Colour.white)).toBe(true);
  });

  it('exposes items as a read-only view of its own state', () => {
    const todoList = newList();
    todoList.addItem(TodoItem.create('item-1', 'Bread'));

    expect(todoList.items).toHaveLength(1);
    expect(todoList.items[0].title).toBe('Bread');
  });

  describe('completeItem', () => {
    it('marks the item done and raises one event', () => {
      const todoList = newList();
      todoList.addItem(TodoItem.create('item-1', 'Bread'));

      todoList.completeItem('item-1');

      expect(todoList.items[0].isDone).toBe(true);
      const events = todoList.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TodoItemCompletedDomainEvent);
      expect(events[0]).toMatchObject({ todoListId: 'list-1', todoItemId: 'item-1' });
    });

    it('throws for an unknown item — the guard behind the handler check', () => {
      expect(() => newList().completeItem('ghost')).toThrow();
    });

    it('drains events once pulled', () => {
      const todoList = newList();
      todoList.addItem(TodoItem.create('item-1', 'Bread'));
      todoList.completeItem('item-1');

      expect(todoList.pullDomainEvents()).toHaveLength(1);
      expect(todoList.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('updateItemDetail', () => {
    it('updates title and priority without raising an event', () => {
      const todoList = newList();
      todoList.addItem(TodoItem.create('item-1', 'Bread', PriorityLevel.Low));

      todoList.updateItemDetail('item-1', 'Sourdough', PriorityLevel.High);

      expect(todoList.items[0].title).toBe('Sourdough');
      expect(todoList.items[0].priority).toBe(PriorityLevel.High);
      expect(todoList.pullDomainEvents()).toHaveLength(0);
    });

    it('rejects an empty title', () => {
      const todoList = newList();
      todoList.addItem(TodoItem.create('item-1', 'Bread'));

      expect(() => todoList.updateItemDetail('item-1', '  ', PriorityLevel.High)).toThrow();
    });
  });

  describe('reconstitute', () => {
    it('rebuilds state without raising events', () => {
      const todoList = TodoList.reconstitute('list-1', 'Groceries', Colour.white, [
        TodoItem.reconstitute('item-1', 'Bread', true, PriorityLevel.None),
      ]);

      expect(todoList.items[0].isDone).toBe(true);
      expect(todoList.pullDomainEvents()).toHaveLength(0);
    });
  });
});
