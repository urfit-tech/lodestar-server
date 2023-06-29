import 'reflect-metadata'
import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { env } from 'process';

import { PostgresEntities } from './entity';

config({ path: `.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`});

export const PostgresDataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  replication: {
    master: {
      url: process.env.POSTGRES_URI,
    },
    slaves: [
      {
        url: process.env.POSTGRES_REPLICA1_URI,
      },
      {
        url: process.env.POSTGRES_REPLICA2_URI,
      },
    ],
  },
  synchronize: false,
  logging: true,
  entities: PostgresEntities,
};
