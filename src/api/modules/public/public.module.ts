import { Module } from '@nestjs/common';
import { DevTokenController } from './health/dev-token.controller';
import { HealthController } from './health/health.controller';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  controllers: isProduction ? [HealthController] : [HealthController, DevTokenController],
})
export class PublicModule {}
