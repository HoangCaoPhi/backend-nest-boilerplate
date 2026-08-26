import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';
import { Public } from '../../../common/auth/public.decorator';
import { HealthResponse } from './health.response';

@ApiTags('public')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly cls: ClsService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponse })
  check(): HealthResponse {
    return { status: 'ok', requestId: this.cls.getId() };
  }
}
