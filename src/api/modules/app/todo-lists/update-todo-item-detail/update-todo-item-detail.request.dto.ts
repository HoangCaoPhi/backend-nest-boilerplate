import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';

export class UpdateTodoItemDetailRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(PriorityLevel)
  priority!: PriorityLevel;
}
