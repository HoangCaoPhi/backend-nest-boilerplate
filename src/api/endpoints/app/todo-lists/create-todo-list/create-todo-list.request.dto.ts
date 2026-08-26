import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTodoListRequestDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  // class-validator's IsNotEmpty() does not trim, so a whitespace-only string ("   ") passes it
  // and would otherwise reach TodoList.create()'s raw throw, which the global filter maps to a
  // generic 500 instead of a proper 400 (github.com/typestack/class-validator/issues/543).
  @Matches(/\S/, { message: 'title must not be blank' })
  title!: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  @IsOptional()
  @IsHexColor()
  colourCode?: string;
}
