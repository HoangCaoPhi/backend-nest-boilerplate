import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SharedKernelModule } from '@infrastructure/common/shared-kernel.module';
import databaseConfig from '@infrastructure/persistence/prisma/database.config';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { OutboxModule } from '@infrastructure/outbox/outbox.module';
import rabbitmqConfig from '@infrastructure/outbox/rabbitmq.config';
import slackConfig from '@infrastructure/external-clients/slack/slack.config';
import { SlackModule } from '@infrastructure/external-clients/slack/slack.module';
import userServiceConfig from '@infrastructure/internal-clients/user-service/user-service.config';
import { UserServiceModule } from '@infrastructure/internal-clients/user-service/user-service.module';
import { AuthModule } from './common/auth/auth.module';
import integrationConfig from './common/auth/integration.config';
import jwtConfig from './common/auth/jwt.config';
import { AppErrorFilter } from './common/filters/app-error.filter';
import { TodoListsModule } from './modules/app/todo-lists/todo-lists.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, rabbitmqConfig, jwtConfig, integrationConfig, slackConfig, userServiceConfig],
    }),
    SharedKernelModule,
    PrismaModule,
    OutboxModule,
    SlackModule,
    UserServiceModule,
    AuthModule,
    TodoListsModule,
    IntegrationModule,
    PublicModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    { provide: APP_FILTER, useClass: AppErrorFilter },
  ],
})
export class AppModule {}
