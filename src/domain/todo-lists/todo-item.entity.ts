import { Entity } from '../common/entity.base';
import { PriorityLevel } from './priority-level.enum';

export class TodoItem extends Entity<string> {
  private _title: string;
  private _isDone: boolean;
  private _priority: PriorityLevel;

  private constructor(id: string, title: string, priority: PriorityLevel) {
    super(id);
    this._title = title;
    this._isDone = false;
    this._priority = priority;
  }

  get title(): string {
    return this._title;
  }

  get isDone(): boolean {
    return this._isDone;
  }

  get priority(): PriorityLevel {
    return this._priority;
  }

  static create(id: string, title: string, priority: PriorityLevel = PriorityLevel.None): TodoItem {
    if (!title.trim()) {
      throw new Error('TodoItem title cannot be empty.');
    }
    return new TodoItem(id, title, priority);
  }

  static reconstitute(id: string, title: string, isDone: boolean, priority: PriorityLevel): TodoItem {
    const item = new TodoItem(id, title, priority);
    if (isDone) {
      item.complete();
    }
    return item;
  }

  complete(): void {
    this._isDone = true;
  }

  rename(title: string): void {
    if (!title.trim()) {
      throw new Error('TodoItem title cannot be empty.');
    }
    this._title = title;
  }

  updateDetail(title: string, priority: PriorityLevel): void {
    this.rename(title);
    this._priority = priority;
  }
}
