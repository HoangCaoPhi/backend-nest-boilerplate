import { AggregateRoot } from './aggregate-root.base';

export interface Repository<T extends AggregateRoot<unknown>> {
  getById(id: string): Promise<T | null>;
  add(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  delete(entity: T): Promise<void>;
}
