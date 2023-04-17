import 'reflect-metadata'
import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { env } from 'process';

import { PostgresEntities, MongoEntities } from './entity';

config({ path: `.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`});

export const PostgresDataSourceConfig: DataSourceOptions = {
  name: 'phdb',
  type: 'postgres',
  url: process.env.POSTGRES_URI,
  synchronize: false,
  logging: true,
  entities: PostgresEntities,
};
export const MongoDataSourceConfig: DataSourceOptions = {
  name: 'ldb',
  type: 'mongodb',
  url: process.env.MONGO_URI,
  logging: true,
  entities: MongoEntities,
};
