import { cwd } from 'process';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PostgresModule } from '~/database/postgres.module';
import { LockModule } from '~/utility/lock/lock.module';
import { UtilityModule } from '~/utility/utility.module';

import { Runner } from './runner';
import { RunnerService } from './runner.service';
import { RunnerController } from './runner.controller';

dayjs.extend(utc);

@Module({})
export class RunnerModule {
  static forRoot(options: {
    workerName: string; nodeEnv: string; clazz: Type<Runner>; noGo?: boolean;
  }): DynamicModule {
    const { workerName, nodeEnv, clazz, noGo } = options;

    const invokedRunnerModule = (clazz as any).forRoot
      ? (clazz as any).forRoot()
      : { imports: [], providers: [] };

    return {
      module: RunnerModule,
      controllers: [RunnerController],
      imports: [
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${nodeEnv ? `.${nodeEnv}` : ''}`,
          isGlobal: true,
        }),
        PostgresModule.forRootAsync(),
        LockModule.forFeature({ key: workerName }),
        UtilityModule,
        ...(invokedRunnerModule.imports || []),
      ],
      providers: [
        Logger,
        RunnerService,
        { provide: 'NO_GO', useValue: noGo },
        { provide: Runner, useClass: clazz },
        ...(invokedRunnerModule.providers || []),
      ],
    };
  }
}
