export interface PaginatedRecord<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    lastPage: number;
  };
}

export interface PaginatableDelegate<T> {
  findMany(args?: Record<string, unknown>): Promise<T[]>;
  count(args?: Record<string, unknown>): Promise<number>;
}

export async function paginate<T>(
  delegate: PaginatableDelegate<T>,
  args: Record<string, unknown> & { where?: Record<string, unknown> },
  pagination: { page: number; pageSize: number },
): Promise<PaginatedRecord<T>> {
  const { page, pageSize } = pagination;
  const skip = page > 0 ? pageSize * (page - 1) : 0;

  const [total, items] = await Promise.all([
    delegate.count({ where: args.where }),
    delegate.findMany({ ...args, skip, take: pageSize }),
  ]);

  return {
    items,
    meta: { total, page, pageSize, lastPage: Math.ceil(total / pageSize) },
  };
}
