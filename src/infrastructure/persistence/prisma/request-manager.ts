import { Inject, Injectable } from '@nestjs/common';
import { RequestManager as IRequestManager } from '@application/common/idempotency/request-manager.interface';
import { TimeProvider } from '@shared-kernel/time-provider/time-provider.interface';
import { TIME_PROVIDER } from '@shared-kernel/time-provider/time-provider.di-tokens';
import { PrismaClientExtended } from './prisma-client.factory';
import { PRISMA_CLIENT } from './prisma.di-tokens';
import { Prisma } from './schema/generated/client';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class RequestManager implements IRequestManager {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClientExtended,
    @Inject(TIME_PROVIDER)
    private readonly timeProvider: TimeProvider,
  ) {}

  // The insert IS the check: a unique-violation means someone else got here first,
  // which a read-then-write check would race against.
  async register(requestId: string, name: string): Promise<boolean> {
    try {
      await this.prisma.processedRequest.create({
        data: { id: requestId, name, processedOn: this.timeProvider.now() },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        return false;
      }
      throw error;
    }
  }

  // deleteMany, not delete: releasing a key that is already gone is not an error.
  async release(requestId: string): Promise<void> {
    await this.prisma.processedRequest.deleteMany({ where: { id: requestId } });
  }
}
