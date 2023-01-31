import 'reflect-metadata'
import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm'

import { App, AppPlan, Currency, Product, Program, ProgramContentSection, ProgramPlan } from './entity';

config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'development' : 'development'}`});

export const AppDataSourceConfig: DataSourceOptions = {
  type: "postgres",
  url: process.env.DB_URI,
  synchronize: false,
  logging: false,
  entities: [
    App, AppPlan, Currency, Product, Program, ProgramContentSection, ProgramPlan,
  ],
  migrations: [],
  subscribers: [],
};
const AppDataSource = new DataSource(AppDataSourceConfig);

export default AppDataSource;
