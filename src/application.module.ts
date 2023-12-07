import { cwd, env } from 'process';
import { LoggerModule } from 'nestjs-pino';
import { Logger, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PostgresModule } from './database/postgres.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { MediaModule } from './media/media.module';
import { UtilityModule } from './utility/utility.module';
import { OrderModule } from './order/order.module';
import { ReportModule } from './report/report.module';
import { AppMiddleware } from './app/app.middleware';
import { AppModule } from './app/app.module';
import { ProgramPackageModule } from './program-package/program-package.module';
import { ProgramModule } from './program/program.module';
import { PodcastModule } from './podcast/podcast.module';
import { SwaggerConfigModule } from './swagger-config/swagger-config.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  controllers: [ApplicationController],
  providers: [Logger, ApplicationService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      useFactory: (configService: ConfigService<{ NODE_ENV: string }>) => {
        const nodeEnv = configService.getOrThrow('NODE_ENV');
        return ['production', 'staging'].includes(nodeEnv)
          ? {}
          : {
              pinoHttp: {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    ignore: 'pid,context,hostname',
                  },
                },
              },
            };
      },
      inject: [ConfigService],
    }),
    PostgresModule.forRootAsync(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (
        configService: ConfigService<{
          QUEUE_REDIS_URI: string;
        }>,
      ) => {
        const queueRedisUri = configService.getOrThrow('QUEUE_REDIS_URI');
        const url = new URL(queueRedisUri);
        return {
          redis: {
            host: url.hostname,
            port: Number(url.port),
            username: url.username,
            password: url.password,
          },
        };
      },
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRoot(MongoDataSourceConfig),
    AuthModule,
    AppModule,
    MemberModule,
    MediaModule,
    UtilityModule,
    // TriggerModule,
    CalendarModule,
    OrderModule,
    ReportModule,
    ProgramPackageModule,
    ProgramModule,
    PodcastModule,
    SwaggerConfigModule,
  ],
})
export class ApplicationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppMiddleware).exclude({ path: 'healthz', method: RequestMethod.GET }).forRoutes('*');
  }
}
