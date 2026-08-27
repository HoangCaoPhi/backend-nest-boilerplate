import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { UnitOfWork } from '@application/common/data/unit-of-work.interface';
import { PrismaAdapter } from './aggregate-repository.base';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly txHost: TransactionHost<PrismaAdapter>) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.txHost.withTransaction(work);
  }
}
