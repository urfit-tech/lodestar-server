import { cwd, env } from 'process';
import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { AuthModule } from './auth/auth.module'
import { CheckoutModule } from './checkout/checkout.module'
import { AppDataSourceConfig } from './data-source'
import { MemberModule } from './member/member.module'
import { UtilityModule } from './utility/utility.module'
import { VendorModule } from './vendor/vendor.module'

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [
    TypeOrmModule.forRoot(AppDataSourceConfig),
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    RouterModule.register([
      {
        path: 'api/v2',
        children: [
          { path: 'auth', module: AuthModule },
        ],
      }
    ]),
    AuthModule,
    UtilityModule,
    MemberModule,
    VendorModule,
    CheckoutModule,
  ],
})
export class ApplicationModule {}
