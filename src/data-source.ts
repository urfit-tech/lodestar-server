import 'reflect-metadata'
import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { env } from 'process';

import { PostgresEntities } from './entity';

config({ path: `.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`});

export const PostgresDataSourceConfig: DataSourceOptions = {
  name: 'phdb',
  type: 'postgres',
  url: process.env.POSTGRES_URI,
  synchronize: false,
  logging: true,
  entities: PostgresEntities,
};
