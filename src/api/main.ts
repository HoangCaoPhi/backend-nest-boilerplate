import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpConfig } from '@infrastructure/config/http.config';
import { LogConfig } from '@infrastructure/config/log.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(LogConfig).levels);
  // Without this, SIGTERM from Docker skips onModuleDestroy and connections leak on redeploy.
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Backend Nest Boilerplate')
    .setDescription('Reference CQRS/DDD service.')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));

  await app.listen(app.get(HttpConfig).port);
}

bootstrap();
