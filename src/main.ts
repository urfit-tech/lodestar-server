import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core'
import { ApiExceptionFilter } from './api.filter'
import { ApplicationModule } from './application.module'
import { WorkerModule } from './worker/worker.module';

async function bootstrap() {
  const { WORKER_NAME } = process.env;
  let app: INestApplication;

  if (WORKER_NAME !== undefined) {
    app = await NestFactory.create(WorkerModule);
    app.listen(0);
  } else {
    app = await NestFactory.create(ApplicationModule);

    app.useGlobalFilters(new ApiExceptionFilter());  
    await app.listen(8081);
  }
}
bootstrap();
