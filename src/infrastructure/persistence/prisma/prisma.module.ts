import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { READ_DB } from '@application/common/data/read-db.di-tokens';
import { REQUEST_MANAGER } from '@application/common/idempotency/idempotency.di-tokens';
import { DatabaseConfig } from '../../config/database.config';
import { createPrismaClient, PrismaClientExtended } from './prisma-client.factory';
import { PRISMA_CLIENT } from './prisma.di-tokens';
import { RequestManager } from './request-manager';

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: (config: DatabaseConfig) => createPrismaClient(config.url),
      inject: [DatabaseConfig],
    },
    { provide: READ_DB, useExisting: PRISMA_CLIENT },
    { provide: REQUEST_MANAGER, useClass: RequestManager },
  ],
  exports: [PRISMA_CLIENT, READ_DB, REQUEST_MANAGER],
})
export class PrismaModule implements OnModuleDestroy {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClientExtended,
  ) {}

  // The client comes from a factory, so it has no lifecycle hook of its own — without this
  // the pool keeps the process alive on shutdown (and hangs test runs).
  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
