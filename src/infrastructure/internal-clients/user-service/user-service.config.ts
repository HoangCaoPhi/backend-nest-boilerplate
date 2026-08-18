import { registerAs } from '@nestjs/config';

export default registerAs('userService', () => ({
  baseUrl: process.env.USER_SERVICE_URL ?? '',
  timeoutMs: Number(process.env.USER_SERVICE_TIMEOUT_MS ?? 5000),
}));
