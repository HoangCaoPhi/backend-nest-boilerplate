export interface ReadDelegate<T> {
  findMany(args?: Record<string, unknown>): Promise<T[]>;
  findUnique(args?: Record<string, unknown>): Promise<T | null>;
  count(args?: Record<string, unknown>): Promise<number>;
}

export interface ReadDb {
  todoList: ReadDelegate<unknown>;
  todoItem: ReadDelegate<unknown>;
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}
