import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { IntegrationConfig } from './integration.config';

@Injectable()
export class IntegrationAuthenticator {
  constructor(private readonly config: IntegrationConfig) {}

  // X-Client-Id is always required; when the caller has a secret configured, also
  // X-Token = HMAC-SHA256(clientSecret, X-Timestamp) within the replay window.
  authenticate(callerName: string, headers: Record<string, unknown>): boolean {
    const caller = this.config.callers[callerName];
    if (!caller?.clientId || headers['x-client-id'] !== caller.clientId) {
      return false;
    }

    if (!caller.clientSecret) {
      return true;
    }

    const timestamp = String(headers['x-timestamp'] ?? '');
    if (!this.isWithinReplayWindow(timestamp)) {
      return false;
    }

    return this.isValidToken(caller.clientSecret, timestamp, String(headers['x-token'] ?? ''));
  }

  private isWithinReplayWindow(timestamp: string): boolean {
    const seconds = Number(timestamp);
    if (!Number.isFinite(seconds)) {
      return false;
    }
    const driftMs = Math.abs(Date.now() - seconds * 1000);
    return driftMs <= this.config.replayWindowMinutes * 60_000;
  }

  private isValidToken(clientSecret: string, timestamp: string, providedTokenHex: string): boolean {
    const expected = createHmac('sha256', clientSecret).update(timestamp).digest();
    const provided = Buffer.from(providedTokenHex, 'hex');
    // timingSafeEqual throws on length mismatch, unlike .NET's FixedTimeEquals.
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  }
}
