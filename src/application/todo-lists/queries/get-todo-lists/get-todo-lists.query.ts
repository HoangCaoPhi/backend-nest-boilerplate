import { Query } from '../../../common/query.base';

export class GetTodoListsQuery extends Query {
  constructor(
    readonly filter?: { title?: string; colourCode?: string },
    readonly orderBy?: Record<string, 'asc' | 'desc'>,
    readonly page = 1,
    readonly pageSize = 20,
  ) {
    super();
  }
}
