import { UuidV7IdGenerator } from '@shared-kernel/id-generator/uuid-v7-id-generator';
import { SystemTimeProvider } from '@shared-kernel/time-provider/system-time-provider';

export abstract class Query {
  readonly id: string = new UuidV7IdGenerator().generate();
  readonly occurredAt: Date = new SystemTimeProvider().now();
}
