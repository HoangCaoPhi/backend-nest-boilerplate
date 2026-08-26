import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsInt, Min } from 'class-validator';
import { validatedConfig } from '@infrastructure/config/validated-config';

export interface IntegrationCaller {
  clientId?: string;
  clientSecret?: string;
}

// One entry per machine-to-machine caller. Add a caller here, then tag its
// endpoints with @Integration('<name>').
export class IntegrationConfig {
  @IsInt()
  @Min(1)
  readonly replayWindowMinutes!: number;

  readonly callers!: Record<string, IntegrationCaller>;
}

export const integrationConfigProvider: Provider = {
  provide: IntegrationConfig,
  useFactory: (config: ConfigService) =>
    validatedConfig(IntegrationConfig, {
      replayWindowMinutes: config.get('INTEGRATION_REPLAY_WINDOW_MINUTES') ?? 5,
      callers: {
        MobileApp: {
          clientId: config.get('INTEGRATION_MOBILE_APP_CLIENT_ID'),
          clientSecret: config.get('INTEGRATION_MOBILE_APP_CLIENT_SECRET'),
        },
      },
    }),
  inject: [ConfigService],
};
