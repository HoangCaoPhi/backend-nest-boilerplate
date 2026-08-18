import { paginate, PaginatableDelegate } from './pagination';

describe('paginate', () => {
  const delegate = (rows: unknown[], total: number): PaginatableDelegate<unknown> & { args: unknown } => ({
    args: undefined,
    findMany(args) {
      (this as { args: unknown }).args = args;
      return Promise.resolve(rows);
    },
    count: () => Promise.resolve(total),
  });

  it('translates page/pageSize into skip/take and keeps caller args', async () => {
    const db = delegate([], 0);

    await paginate(db, { where: { title: 'x' }, orderBy: { id: 'asc' } }, { page: 3, pageSize: 20 });

    expect(db.args).toMatchObject({
      where: { title: 'x' },
      orderBy: { id: 'asc' },
      skip: 40,
      take: 20,
    });
  });

  it('reports the last page from the total', async () => {
    const { meta } = await paginate(delegate([{}], 41), {}, { page: 1, pageSize: 20 });

    expect(meta).toEqual({ total: 41, page: 1, pageSize: 20, lastPage: 3 });
  });

  it('does not skip on the first page', async () => {
    const db = delegate([], 0);

    await paginate(db, {}, { page: 1, pageSize: 10 });

    expect(db.args).toMatchObject({ skip: 0, take: 10 });
  });
});
