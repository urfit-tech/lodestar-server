import { cwd } from 'process';
import { DynamicModule, Module, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppDataSourceConfig } from '~/data-source';
import { Runner } from './runner';
import { RunnerService } from './runner.service';
import { ExampleRunner } from './example.runner';
import { RunnerType } from './runner.type';

@Module({})
export class RunnerModule {
  static createRunnerProvider(workerName: RunnerType): Type<Runner> {
    switch (workerName) {
      case RunnerType.EXAMPLE_RUNNER:
        return ExampleRunner;
      default:
        throw new Error(`Given runner name is not exists: ${workerName}`);
    }
  }

  static forRoot(options: {
    workerName: RunnerType; nodeEnv: string;
  }): DynamicModule {
    const { workerName, nodeEnv } = options;
    return {
      module: RunnerModule,
      imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot(AppDataSourceConfig),
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${nodeEnv ? `.${nodeEnv}` : ''}`,
          isGlobal: true,
        }),
      ],
      providers: [
        { provide: RunnerService, useClass: RunnerService },
        { provide: Runner, useClass: this.createRunnerProvider(workerName) },
      ],
    };
  }
}
