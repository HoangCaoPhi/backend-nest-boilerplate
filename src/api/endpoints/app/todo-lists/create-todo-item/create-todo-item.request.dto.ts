import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateTodoItemRequestDto {
  @ApiProperty({ example: 'Bread' })
  @IsString()
  @IsNotEmpty()
  // See create-todo-list.request.dto.ts: IsNotEmpty() alone lets a whitespace-only title through.
  @Matches(/\S/, { message: 'title must not be blank' })
  title!: string;
}
