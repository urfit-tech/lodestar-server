import { cwd, env } from 'process';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppDataSourceConfig } from '~/data-source';
import { RunnerType } from './runner/runner';
import { RunnerModule } from './runner/runner.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSourceConfig),
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    RunnerModule.forRoot({
      workerName: env.WORKER_NAME as RunnerType,
      nodeEnv: env.NODE_ENV,
    }),
  ],
})
export class WorkerModule {}
