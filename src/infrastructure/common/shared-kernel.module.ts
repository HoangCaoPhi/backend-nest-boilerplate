import { Global, Module } from '@nestjs/common';
import { ID_GENERATOR } from '@shared-kernel/id-generator/id-generator.di-tokens';
import { UuidV7IdGenerator } from '@shared-kernel/id-generator/uuid-v7-id-generator';
import { TIME_PROVIDER } from '@shared-kernel/time-provider/time-provider.di-tokens';
import { SystemTimeProvider } from '@shared-kernel/time-provider/system-time-provider';

// shared-kernel stays framework-free, so its DI wiring lives here instead.
@Global()
@Module({
  providers: [
    { provide: ID_GENERATOR, useFactory: () => new UuidV7IdGenerator() },
    { provide: TIME_PROVIDER, useFactory: () => new SystemTimeProvider() },
  ],
  exports: [ID_GENERATOR, TIME_PROVIDER],
})
export class SharedKernelModule {}
