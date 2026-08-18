import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../common/auth/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
