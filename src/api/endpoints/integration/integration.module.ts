import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MobileAppController } from './mobile-app/mobile-app.controller';

// Handlers are registered once (TodoListsModule); the QueryBus resolves them globally.
@Module({
  imports: [CqrsModule],
  controllers: [MobileAppController],
})
export class IntegrationModule {}
