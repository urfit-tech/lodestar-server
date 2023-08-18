import { LoggerOptions } from 'typeorm';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostgresDataSourceConfig } from '~/data-source';
import { RunnerModule } from '~/runner/runner.module';

@Module({})
export class PostgresModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RunnerModule,
      imports: [
        TypeOrmModule.forRootAsync({
          name: PostgresDataSourceConfig.name,
          imports: [ConfigModule],
          useFactory: async (
            configService: ConfigService<{
              POSTGRES_LOGGING: LoggerOptions;
            }>,
          ) => {
            return {
              ...PostgresDataSourceConfig,
              logging: configService.get('POSTGRES_LOGGING') || false,
            };
          },
          inject: [ConfigService],
        }),
      ],
    };
  }
}
