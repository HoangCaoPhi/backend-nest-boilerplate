import { Query } from '../../../common/message/query.base';

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
