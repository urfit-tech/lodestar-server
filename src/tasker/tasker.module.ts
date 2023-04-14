import { cwd } from 'process';
import { DynamicModule, Module, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppDataSourceConfig } from '~/data-source';
import { ExampleTasker } from './example.tasker';
import { BullModule } from '@nestjs/bull';
import { TaskerType } from './tasker';

@Module({})
export class TaskerModule {
  static createTaskerProvider(workerName: TaskerType): Type<any> {
    switch (workerName) {
      case TaskerType.EXAMPLE_TASKER:
        return ExampleTasker;
      default:
        throw new Error(`Given tasker name is not exists: ${workerName}`);
    }
  }

  static forRoot(options: { workerName: TaskerType, nodeEnv: string }): DynamicModule {
    const { workerName, nodeEnv } = options;
    return {
      module: TaskerModule,
      imports: [
        TypeOrmModule.forRoot(AppDataSourceConfig),
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
      providers: [this.createTaskerProvider(workerName)],
    };
  }
}
