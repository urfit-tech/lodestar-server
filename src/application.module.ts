import { cwd, env } from 'process';
import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { AuthModule } from './auth/auth.module'
import { CheckoutModule } from './checkout/checkout.module'
import { PostgresDataSourceConfig, MongoDataSourceConfig } from './data-source'
import { MemberModule } from './member/member.module'
import { UtilityModule } from './utility/utility.module'
import { VendorModule } from './vendor/vendor.module'
import { TriggerModule } from './trigger/trigger.module';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [
    TypeOrmModule.forRoot(PostgresDataSourceConfig),
    TypeOrmModule.forRoot(MongoDataSourceConfig),
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    RouterModule.register([
      {
        path: 'api/v2',
        children: [AuthModule, TriggerModule],
      }
    ]),
    AuthModule,
    UtilityModule,
    MemberModule,
    VendorModule,
    CheckoutModule,
    TriggerModule,
  ],
})
export class ApplicationModule {}
