import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Logger } from 'nestjs-pino';
import { json, urlencoded } from 'express';
import { INestApplication, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { RunnerModule } from './runner/runner.module';
import { RunnerType } from './runner/runner.type';
import { TaskerModule } from './tasker/tasker.module';
import { TaskerType } from './tasker/tasker.type';
import { ApiExceptionFilter } from './api.filter';
import { ApplicationModule } from './application.module';
import { ShutdownService } from './utility/shutdown/shutdown.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dayjs.extend(utc);

async function bootstrap() {
  const { env } = process;
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv, PORT: port } = env;
  let app: INestApplication;

  if (workerName !== undefined) {
    if (RunnerType[workerName] !== undefined) {
      app = await NestFactory.create(
        RunnerModule.forRoot({
          workerName,
          nodeEnv,
          clazz: RunnerType[workerName],
        }),
        { bufferLogs: true },
      );
    } else if (TaskerType[workerName] !== undefined) {
      app = await NestFactory.create(
        TaskerModule.forRoot({
          workerName,
          nodeEnv,
          clazz: TaskerType[workerName],
        }),
        { bufferLogs: true },
      );
    } else {
      throw new Error(`Unknown WORKER_NAME env: ${workerName}`);
    }
    app.get(ShutdownService).subscribeToShutdown(async () => {
      await app.close();
      process.exit(1);
    });
  } else {
    app = await NestFactory.create(ApplicationModule, { bufferLogs: true });
    app = app
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .setGlobalPrefix('api', {
        exclude: [{ path: 'healthz', method: RequestMethod.GET }],
      })
      .enableVersioning({ type: VersioningType.URI })
      .use(json({ limit: '10mb' }))
      .use(urlencoded({ extended: true, limit: '10mb' }));
    const swaggerConfig = new DocumentBuilder().build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('lodestar/docs', app, document);
  }

  app = app.enableShutdownHooks();
  app.useLogger(app.get(Logger));
  app = await app.listen(port || 8081);
}
bootstrap();
