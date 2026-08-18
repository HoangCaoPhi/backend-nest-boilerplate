import { createHmac } from 'node:crypto';
import { IntegrationAuthenticator } from './integration-authenticator';

describe('IntegrationAuthenticator', () => {
  const secret = 'mobile-app-secret';
  const authenticator = new IntegrationAuthenticator({
    replayWindowMinutes: 5,
    callers: {
      MobileApp: { clientId: 'mobile-app', clientSecret: secret },
      NoSecretCaller: { clientId: 'no-secret' },
    },
  });

  const sign = (timestamp: string) => createHmac('sha256', secret).update(timestamp).digest('hex');
  const now = () => Math.floor(Date.now() / 1000).toString();

  const headersFor = (timestamp: string, token = sign(timestamp)) => ({
    'x-client-id': 'mobile-app',
    'x-timestamp': timestamp,
    'x-token': token,
  });

  it('accepts a correctly signed request inside the replay window', () => {
    expect(authenticator.authenticate('MobileApp', headersFor(now()))).toBe(true);
  });

  it('rejects an unknown caller', () => {
    expect(authenticator.authenticate('Ghost', headersFor(now()))).toBe(false);
  });

  it('rejects a mismatched client id', () => {
    expect(authenticator.authenticate('MobileApp', { ...headersFor(now()), 'x-client-id': 'other' })).toBe(false);
  });

  it('rejects a tampered token', () => {
    expect(authenticator.authenticate('MobileApp', headersFor(now(), 'deadbeef'))).toBe(false);
  });

  it('rejects a token signed with the wrong secret', () => {
    const timestamp = now();
    const wrong = createHmac('sha256', 'not-the-secret').update(timestamp).digest('hex');

    expect(authenticator.authenticate('MobileApp', headersFor(timestamp, wrong))).toBe(false);
  });

  it('rejects a timestamp outside the replay window', () => {
    const stale = (Math.floor(Date.now() / 1000) - 3600).toString();

    expect(authenticator.authenticate('MobileApp', headersFor(stale))).toBe(false);
  });

  it('rejects a non-numeric timestamp', () => {
    expect(authenticator.authenticate('MobileApp', headersFor('not-a-number'))).toBe(false);
  });

  it('rejects missing headers outright', () => {
    expect(authenticator.authenticate('MobileApp', {})).toBe(false);
  });

  it('skips the signature check when the caller has no secret configured', () => {
    expect(authenticator.authenticate('NoSecretCaller', { 'x-client-id': 'no-secret' })).toBe(true);
  });
});
