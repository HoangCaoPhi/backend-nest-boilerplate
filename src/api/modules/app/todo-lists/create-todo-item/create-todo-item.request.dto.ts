import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTodoItemRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}
