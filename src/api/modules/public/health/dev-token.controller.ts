import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../../../common/auth/public.decorator';

// Dev-only. Real tokens are issued by the user service with the same signing key.
@Controller('dev/token')
@Public()
export class DevTokenController {
  constructor(private readonly jwtService: JwtService) {}

  @Post()
  async issue(@Body() body: { userId?: string }): Promise<{ token: string }> {
    return { token: await this.jwtService.signAsync({ sub: body.userId ?? 'dev-user' }) };
  }
}
