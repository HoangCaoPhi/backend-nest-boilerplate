import { AggregateRoot } from '../common/aggregate-root.base';
import { TodoItem } from './todo-item.entity';
import { TodoItemCompletedDomainEvent } from './events/todo-item-completed.domain-event';
import { Colour } from './colour.value-object';
import { PriorityLevel } from './priority-level.enum';

export class TodoList extends AggregateRoot<string> {
  private _title: string;
  private readonly _colour: Colour;
  private readonly _items: TodoItem[] = [];

  private constructor(id: string, title: string, colour: Colour) {
    super(id);
    this._title = title;
    this._colour = colour;
  }

  get title(): string {
    return this._title;
  }

  get colour(): Colour {
    return this._colour;
  }

  get items(): ReadonlyArray<TodoItem> {
    return this._items;
  }

  static create(id: string, title: string, colour: Colour = Colour.white): TodoList {
    if (!title.trim()) {
      throw new Error('TodoList title cannot be empty.');
    }
    return new TodoList(id, title, colour);
  }

  static reconstitute(id: string, title: string, colour: Colour, items: TodoItem[]): TodoList {
    const todoList = new TodoList(id, title, colour);
    items.forEach((item) => todoList._items.push(item));
    return todoList;
  }

  addItem(item: TodoItem): void {
    this._items.push(item);
  }

  removeItem(itemId: string): void {
    const index = this._items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new Error(`TodoItem with id "${itemId}" was not found in this list.`);
    }
    this._items.splice(index, 1);
  }

  updateItemDetail(itemId: string, title: string, priority: PriorityLevel): void {
    this.itemOrThrow(itemId).updateDetail(title, priority);
  }

  completeItem(itemId: string): void {
    const item = this.itemOrThrow(itemId);
    item.complete();
    this.addDomainEvent(new TodoItemCompletedDomainEvent(this.id, itemId));
  }

  private itemOrThrow(itemId: string): TodoItem {
    const item = this._items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`TodoItem with id "${itemId}" was not found in this list.`);
    }
    return item;
  }
}
