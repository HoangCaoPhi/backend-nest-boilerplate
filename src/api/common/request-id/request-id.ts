import type { IncomingHttpHeaders } from 'node:http';
import { UuidV7IdGenerator } from '@shared-kernel/id-generator/uuid-v7-id-generator';

const idGenerator = new UuidV7IdGenerator();

const SAFE_INCOMING_ID = /^[\w.-]{1,128}$/;

export function requestIdFrom(req: { headers: IncomingHttpHeaders }): string {
  const incoming = req.headers['x-request-id'];
  const reusable = typeof incoming === 'string' && SAFE_INCOMING_ID.test(incoming);

  return reusable ? incoming : idGenerator.generate();
}
