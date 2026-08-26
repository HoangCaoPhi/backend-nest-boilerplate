import { Query } from '../../../common/message/query.base';

export class GetTodoItemsWithPaginationQuery extends Query {
  constructor(
    readonly todoListId: string,
    readonly page = 1,
    readonly pageSize = 20,
  ) {
    super();
  }
}
