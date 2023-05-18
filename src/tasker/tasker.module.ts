import { cwd } from 'process';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { PostgresModule } from '~/database/postgres.module';

import { TaskerType } from './tasker';

@Module({})
export class TaskerModule {
  static forRoot(options: { workerName: string, nodeEnv: string }): DynamicModule {
    const { workerName, nodeEnv } = options;

    if (TaskerType[workerName] === undefined) {
      throw new Error(`Given tasker name is not exists: ${workerName}`);
    }

    return {
      module: TaskerModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${nodeEnv ? `.${nodeEnv}` : ''}`,
          isGlobal: true,
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
        BullModule.registerQueue({ name: workerName }),
      ],
      providers: [TaskerType[workerName]],
    };
  }
}
