import { cwd } from 'process';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { LoggerModule } from 'nestjs-pino';
import { DynamicModule, Module, Type, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { PostgresModule } from '~/database/postgres.module';
import { UtilityModule } from '~/utility/utility.module';

import { Tasker } from './tasker';

dayjs.extend(utc);

@Module({})
export class TaskerModule {
  static forRoot(options: { workerName: string, nodeEnv: string, clazz: Type<Tasker>; }): DynamicModule {
    const { workerName, nodeEnv, clazz } = options;

    const invokedTaskerModule = (clazz as any).forRoot
      ? (clazz as any).forRoot()
      : { imports: [], providers: [] };

    return {
      module: TaskerModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${nodeEnv ? `.${nodeEnv}` : ''}`,
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
        UtilityModule,
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
        BullModule.registerQueue({ name: workerName }),
        ...(invokedTaskerModule.imports || []),
      ],
      providers: [
        Logger,
        { provide: Tasker, useClass: clazz },
        ...(invokedTaskerModule.providers || []),
      ],
    };
  }
}
