import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Logger } from 'nestjs-pino';
import { json, urlencoded } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { RunnerModule } from './runner/runner.module';
import { RunnerType } from './runner/runner.type';
import { TaskerModule } from './tasker/tasker.module';
import { TaskerType } from './tasker/tasker.type';
import { ApiExceptionFilter } from './api.filter';
import { ApplicationModule } from './application.module';
import { ShutdownService } from './utility/shutdown/shutdown.service';
import { CacheService } from './utility/cache/cache.service';
import corsOptionDelegate from './cors';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { SwaggerConfigService } from './swagger-config/swagger-config.service';

dayjs.extend(utc);

async function bootstrap() {
  const { env } = process;
  const { WORKER_NAME: workerName, NODE_ENV: nodeEnv, PORT: port } = env;
  let app: NestExpressApplication;

  if (workerName !== undefined) {
    if (RunnerType[workerName] !== undefined) {
      app = await NestFactory.create<NestExpressApplication>(
        RunnerModule.forRoot({
          workerName,
          nodeEnv,
          clazz: RunnerType[workerName],
        }),
        { bufferLogs: true },
      );
    } else if (TaskerType[workerName] !== undefined) {
      app = await NestFactory.create<NestExpressApplication>(
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
    app = await NestFactory.create<NestExpressApplication>(ApplicationModule, {
      bufferLogs: true,
      cors: corsOptionDelegate,
    });
    app.set('trust proxy', 1);

    const configService = app.get(
      ConfigService<{
        NODE_ENV: string;
        SESSION_SECRET: string;
      }>,
    );
    const cacheService = app.get(CacheService);
    const nodeEnv = configService.getOrThrow('NODE_ENV');
    const sessionSecret = configService.getOrThrow('SESSION_SECRET');

    app = app
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .setGlobalPrefix('api', {
        exclude: [{ path: 'healthz', method: RequestMethod.GET }],
      })
      .enableVersioning({ type: VersioningType.URI })
      .use(json({ limit: '10mb' }))
      .use(urlencoded({ extended: true, limit: '10mb' }))
      .use(
        session({
          secret: sessionSecret || 'kolable',
          store: new RedisStore({ client: cacheService.getClient() }),
          resave: false,
          saveUninitialized: false,
          cookie: {
            httpOnly: true,
            sameSite: nodeEnv === 'development' ? 'strict' : 'none',
            secure: nodeEnv === 'development' ? false : true,
            maxAge: 30 * 86400 * 1000, // 30 days
          },
        }),
      )
      .use(cookieParser());

    SwaggerConfigService.setupSwagger(app, {
      title: 'Member API',
      version: '2',
      tags: ['Auth', 'Member'],
      bearerAuth: true,
      endpoint: 'lodestar/docs/member',
      documentOptions: { include: [MemberModule, AuthModule] },
      routeFilter: (path) => path.includes('/v2/'),
    });
  }

  app = app.enableShutdownHooks();
  app.useLogger(app.get(Logger));
  await app.listen(port || 8081);
}
bootstrap();
