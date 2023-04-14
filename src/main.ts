import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core'
import { ApiExceptionFilter } from './api.filter'
import { ApplicationModule } from './application.module'

import { RunnerModule } from './runner/runner.module';
import { RunnerType } from './runner/runner.type';

async function bootstrap() {
  const { env } = process;
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv } = env;
  let app: INestApplication;

  if (workerName !== undefined) {
    if (workerName in RunnerType) {
      app = await NestFactory.create(RunnerModule.forRoot({
        workerName: workerName as RunnerType, nodeEnv,
      }));
    } else {
      throw new Error('Unknown WORKER_NAME env.');
    }
    app.listen(0);
  } else {
    app = await NestFactory.create(ApplicationModule);

    app.useGlobalFilters(new ApiExceptionFilter());  
    await app.listen(8081);
  }
}
bootstrap();
