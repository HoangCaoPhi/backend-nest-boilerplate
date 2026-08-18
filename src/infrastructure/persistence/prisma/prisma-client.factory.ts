import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './schema/generated/client';

export function createPrismaClient(url: string) {
  const adapter = new PrismaPg({ connectionString: url });
  const logQueries = process.env.PRISMA_LOG_QUERIES === 'true';
  const logger = new Logger('Prisma');

  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!logQueries) {
            return query(args);
          }
          const start = performance.now();
          const result = await query(args);
          logger.debug(`${model}.${operation} ${(performance.now() - start).toFixed(1)}ms`);
          return result;
        },
      },
    },
  });
}

export type PrismaClientExtended = ReturnType<typeof createPrismaClient>;
