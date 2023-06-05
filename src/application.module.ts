import { cwd, env } from 'process';
import { LoggerModule } from 'nestjs-pino';
import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config'

import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { PostgresModule } from './database/postgres.module';
import { AuthModule } from './auth/auth.module'
import { MemberModule } from './member/member.module'
import { MediaModule } from './media/media.module';
import { UtilityModule } from './utility/utility.module'

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      useFactory: (configService: ConfigService<{ NODE_ENV: string }>) => {
        const nodeEnv = configService.getOrThrow('NODE_ENV');
        return ['production', 'staging'].includes(nodeEnv) ? {
          pinoHttp: {
            transport: {
              target: 'pino-pretty',
              options: {
                ignore: 'pid,context,hostname',
              },
            },
          },
        } : {};
      },
      inject: [ConfigService],
    }),
    PostgresModule.forRootAsync(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<{
        QUEUE_REDIS_URI: string;
      }>) => {
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
    MemberModule,
    MediaModule,
    UtilityModule,
    // TriggerModule,
  ],
})
export class ApplicationModule {}
