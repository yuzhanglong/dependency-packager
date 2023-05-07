import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initRedisServer } from './utils/redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await initRedisServer();
  await app.listen(8080);
}

bootstrap();
