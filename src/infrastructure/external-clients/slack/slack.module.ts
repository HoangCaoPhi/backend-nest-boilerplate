import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigType } from '@nestjs/config';
import { SLACK_CLIENT } from '@application/common/external-clients/slack/slack.di-tokens';
import slackConfig from './slack.config';
import { SlackClient } from './slack.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: ConfigType<typeof slackConfig>) => ({
        baseURL: config.webhookUrl,
        timeout: config.timeoutMs,
      }),
      inject: [slackConfig.KEY],
    }),
  ],
  providers: [{ provide: SLACK_CLIENT, useClass: SlackClient }],
  exports: [SLACK_CLIENT],
})
export class SlackModule {}
