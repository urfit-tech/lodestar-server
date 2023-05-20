import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
import { INestApplication, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core'

import { RunnerModule } from './runner/runner.module';
import { RunnerType } from './runner/runner.type';
import { TaskerModule } from './tasker/tasker.module';
import { TaskerType } from './tasker/tasker';
import { ApiExceptionFilter } from './api.filter'
import { ApplicationModule } from './application.module'
import { ShutdownService } from './utility/shutdown/shutdown.service';

dayjs.extend(utc);

async function bootstrap() {
  const { env } = process;
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv, PORT: port } = env;
  let app: INestApplication;

  if (workerName !== undefined) {
    if (RunnerType[workerName] !== undefined) {
      app = await NestFactory.create(RunnerModule.forRoot({
        workerName, nodeEnv, clazz: RunnerType[workerName],
      }));
    } else if (TaskerType[workerName] !== undefined) {
      app = await NestFactory.create(TaskerModule.forRoot({
        workerName, nodeEnv,
      }));
    } else {
      throw new Error(`Unknown WORKER_NAME env: ${workerName}`);
    }
    app.get(ShutdownService).subscribeToShutdown(async () => {
      await app.close();
      process.exit(1);
    });
  } else {
    app = await NestFactory.create(ApplicationModule);

    app = app
      .useGlobalFilters(new ApiExceptionFilter())
      .setGlobalPrefix('api')
      .enableVersioning({ type: VersioningType.URI });
  }
  app = app
    .enableShutdownHooks();
  app = await app.listen(port || 8081);
}
bootstrap();
