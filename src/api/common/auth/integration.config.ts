import { registerAs } from '@nestjs/config';

export interface IntegrationCaller {
  clientId?: string;
  clientSecret?: string;
}

// One entry per machine-to-machine caller. Add a caller here, then tag its
// endpoints with @Integration('<name>').
export default registerAs('integration', () => ({
  replayWindowMinutes: Number(process.env.INTEGRATION_REPLAY_WINDOW_MINUTES ?? 5),
  callers: {
    MobileApp: {
      clientId: process.env.INTEGRATION_MOBILE_APP_CLIENT_ID,
      clientSecret: process.env.INTEGRATION_MOBILE_APP_CLIENT_SECRET,
    },
  } as Record<string, IntegrationCaller>,
}));
