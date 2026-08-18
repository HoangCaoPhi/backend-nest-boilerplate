export interface TodoListBriefResponse {
  id: string;
  title: string;
  colourCode: string;
  incompleteItemCount: number;
}

export interface GetTodoListsResponse {
  items: TodoListBriefResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    lastPage: number;
  };
}
