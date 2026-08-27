import { Command as CqrsCommand } from '@nestjs/cqrs';
import { UuidV7IdGenerator } from '@shared-kernel/id-generator/uuid-v7-id-generator';
import { SystemTimeProvider } from '@shared-kernel/time-provider/system-time-provider';
import { Result } from '@shared-kernel/result/result';

export abstract class Command<TValue = void> extends CqrsCommand<Result<TValue>> {
  readonly id: string = new UuidV7IdGenerator().generate();
  readonly occurredAt: Date = new SystemTimeProvider().now();
}
