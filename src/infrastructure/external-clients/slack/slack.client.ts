import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigType } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SlackClient as ISlackClient } from '@application/common/external-clients/slack/slack.client.interface';
import slackConfig from './slack.config';

@Injectable()
export class SlackClient implements ISlackClient {
  private readonly logger = new Logger(SlackClient.name);

  constructor(
    private readonly http: HttpService,
    @Inject(slackConfig.KEY)
    private readonly config: ConfigType<typeof slackConfig>,
  ) {}

  // Best-effort: a notification failure must not fail the caller's use case.
  async notify(message: string): Promise<void> {
    if (!this.config.webhookUrl) {
      this.logger.debug('Slack webhook not configured, skipping notification');
      return;
    }

    try {
      await firstValueFrom(this.http.post('', { text: message }));
    } catch (error) {
      this.logger.error('Failed to notify Slack', error);
    }
  }
}
