import { cwd } from 'process';
import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostgresDataSourceConfig } from '~/data-source';
import { LockModule } from '~/utility/lock/lock.module';
import { UtilityModule } from '~/utility/utility.module';

import { Runner } from './runner';
import { RunnerService } from './runner.service';
import { RunnerController } from './runner.controller';

@Module({})
export class RunnerModule {
  static forRoot(options: {
    workerName: string; nodeEnv: string; clazz: Type<Runner>;
  }): DynamicModule {
    const { workerName, nodeEnv, clazz } = options;

    return {
      module: RunnerModule,
      controllers: [RunnerController],
      imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot(PostgresDataSourceConfig),
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${nodeEnv ? `.${nodeEnv}` : ''}`,
          isGlobal: true,
        }),
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
        LockModule.forFeature({ key: workerName }),
      ],
      providers: [
        Logger,
        RunnerService,
        { provide: Runner, useClass: clazz },
      ],
    };
  }
}
