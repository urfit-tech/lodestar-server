import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core'
import { ApiExceptionFilter } from './api.filter'
import { ApplicationModule } from './application.module'

import { RunnerModule } from './runner/runner.module';
import { RunnerType } from './runner/runner.type';
import { TaskerModule } from './tasker/tasker.module';
import { TaskerType } from './tasker/tasker';

async function bootstrap() {
  const { env } = process;
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv } = env;
  let app: INestApplication;
  let port: number;

  if (workerName !== undefined) {
    if (workerName in RunnerType) {
      app = await NestFactory.create(RunnerModule.forRoot({
        workerName: workerName as RunnerType, nodeEnv,
      }));
    } else if (workerName in TaskerType) {
      app = await NestFactory.create(TaskerModule.forRoot({
        workerName: workerName as TaskerType, nodeEnv,
      }));
    } else {
      throw new Error('Unknown WORKER_NAME env.');
    }
    port = 0;
  } else {
    app = await NestFactory.create(ApplicationModule);

    app.useGlobalFilters(new ApiExceptionFilter());  
    port = 8081;
  }
  
  app.enableShutdownHooks();
  await app.listen(port);
}
bootstrap();
