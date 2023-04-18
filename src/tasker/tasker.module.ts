import { cwd } from 'process';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { PostgresDataSourceConfig } from '~/data-source';
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
        TypeOrmModule.forRoot(PostgresDataSourceConfig),
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${nodeEnv ? `.${nodeEnv}` : ''}`,
          isGlobal: true,
        }),
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
