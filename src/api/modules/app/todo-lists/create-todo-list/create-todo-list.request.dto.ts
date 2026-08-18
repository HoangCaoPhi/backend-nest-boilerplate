import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTodoListRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsHexColor()
  colourCode?: string;
}
