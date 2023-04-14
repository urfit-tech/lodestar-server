import { cwd, env } from 'process';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppDataSourceConfig } from '~/data-source';
import { ExampleRunner } from './example.runner';
import { RunnerService } from './runner.service';

@Module({})
export class RunnerModule {
  static forRoot(): DynamicModule {
    return {
      module: RunnerModule,
      imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot(AppDataSourceConfig),
        ConfigModule.forRoot({
          envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
          isGlobal: true,
        }),
      ],
      providers: [RunnerService, ExampleRunner],
    };
  }
}
