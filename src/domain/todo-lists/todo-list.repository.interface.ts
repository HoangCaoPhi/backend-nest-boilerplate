import { Repository } from '../common/repository.interface';
import { TodoList } from './todo-list.entity';

export interface TodoListRepository extends Repository<TodoList> {}
