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
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv, PORT: port } = env;
  let app: INestApplication;

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
  } else {
    app = await NestFactory.create(ApplicationModule);

    app.useGlobalFilters(new ApiExceptionFilter());  
  }
  
  app.enableShutdownHooks();
  await app.listen(port || 8081);
}
bootstrap();
