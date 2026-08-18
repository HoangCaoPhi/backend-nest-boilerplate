import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';

export interface TodoItemBriefResponse {
  id: string;
  title: string;
  isDone: boolean;
  priority: PriorityLevel;
}

export interface GetTodoItemsWithPaginationResponse {
  items: TodoItemBriefResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    lastPage: number;
  };
}
