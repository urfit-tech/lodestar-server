import 'reflect-metadata'
import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm'
import { env } from 'process';

config({ path: `.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`});
console.log(__dirname);
export const AppDataSourceConfig: DataSourceOptions = {
  type: "postgres",
  url: process.env.DB_URI,
  synchronize: false,
  logging: true,
  entities: [`${__dirname}/entity/*`],
};
const AppDataSource = new DataSource(AppDataSourceConfig);

export default AppDataSource;
