import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';

export class UpdateTodoItemDetailRequestDto {
  @ApiProperty({ example: 'Sourdough' })
  @IsString()
  @IsNotEmpty()
  // See create-todo-list.request.dto.ts: IsNotEmpty() alone lets a whitespace-only title through.
  @Matches(/\S/, { message: 'title must not be blank' })
  title!: string;

  @ApiProperty({ enum: PriorityLevel, example: PriorityLevel.High })
  @IsEnum(PriorityLevel)
  priority!: PriorityLevel;
}
