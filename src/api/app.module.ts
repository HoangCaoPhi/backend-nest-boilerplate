import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';
import { OutboxModule } from '@infrastructure/outbox/outbox.module';
import { PublicHolidayModule } from '@infrastructure/external-clients/public-holiday/public-holiday.module';
import { UserServiceModule } from '@infrastructure/internal-clients/user-service/user-service.module';
import { AuthModule } from './common/auth/auth.module';
import { AppErrorFilter } from './common/app-error/app-error.filter';
import { ResultInterceptor } from './common/app-error/result.interceptor';
import { requestIdFrom } from './common/request-id/request-id';
import { TodoListsModule } from './endpoints/app/todo-lists/todo-lists.module';
import { IntegrationModule } from './endpoints/integration/integration.module';
import { PublicModule } from './endpoints/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    PrismaModule,
    OutboxModule,
    PublicHolidayModule,
    UserServiceModule,
    AuthModule,
    // Mounted as middleware, not an interceptor: interceptors run after guards and outside
    // the exception filter, so a request rejected by AuthGuard would carry no request id.
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, generateId: true, idGenerator: requestIdFrom },
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterPrisma<PrismaClientExtended>({
            prismaInjectionToken: PRISMA_CLIENT,
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
    TodoListsModule,
    IntegrationModule,
    PublicModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
    { provide: APP_INTERCEPTOR, useClass: ResultInterceptor },
    { provide: APP_FILTER, useClass: AppErrorFilter },
  ],
})
export class AppModule {}
