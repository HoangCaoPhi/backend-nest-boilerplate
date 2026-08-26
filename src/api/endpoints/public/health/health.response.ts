import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ example: 'ok' })
  readonly status!: string;

  @ApiProperty({ example: '01a0383b-9693-7783-9c79-74d7b4631f21' })
  readonly requestId!: string;
}
