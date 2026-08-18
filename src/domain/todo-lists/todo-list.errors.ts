import { AppError } from '@shared-kernel/result/error';

export class TodoListErrors {
  static notFound(id: string): AppError {
    return AppError.notFound('TodoList.NotFound', `TodoList with id "${id}" was not found.`);
  }

  static itemNotFound(id: string): AppError {
    return AppError.notFound('TodoList.ItemNotFound', `TodoItem with id "${id}" was not found in this list.`);
  }
}
