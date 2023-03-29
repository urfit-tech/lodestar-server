import 'reflect-metadata'
import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm'

config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'development' : 'development'}`});

export const AppDataSourceConfig: DataSourceOptions = {
  type: "postgres",
  url: process.env.DB_URI,
  synchronize: false,
  logging: true,
  entities: [`${__dirname}/entity/*`],
};
const AppDataSource = new DataSource(AppDataSourceConfig);

export default AppDataSource;
