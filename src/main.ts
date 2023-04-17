import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core'

import { RunnerModule } from './runner/runner.module';
import { RunnerType } from './runner/runner.type';
import { TaskerModule } from './tasker/tasker.module';
import { TaskerType } from './tasker/tasker';
import { ApiExceptionFilter } from './api.filter'
import { ApplicationModule } from './application.module'

async function bootstrap() {
  const { env } = process;
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv } = env;
  let app: INestApplication;
  let port: number;

  if (workerName !== undefined) {
    if (RunnerType[workerName] !== undefined) {
      app = await NestFactory.create(RunnerModule.forRoot({
        workerName, nodeEnv,
      }));
    } else if (TaskerType[workerName] !== undefined) {
      app = await NestFactory.create(TaskerModule.forRoot({
        workerName, nodeEnv,
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
