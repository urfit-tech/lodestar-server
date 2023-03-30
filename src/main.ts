import { NestFactory } from '@nestjs/core'
import { ApiExceptionFilter } from './api.filter'
import { ApplicationModule } from './application.module'

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);

  app.useGlobalFilters(new ApiExceptionFilter());
  
  await app.listen(8081)
}
bootstrap()
