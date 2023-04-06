import { cwd, env } from 'process';
import { Module } from '@nestjs/common'
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
import { WorkerModule } from './worker/worker.module'

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [
    TypeOrmModule.forRoot(AppDataSourceConfig),
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    UtilityModule,
    MemberModule,
    AuthModule,
    VendorModule,
    WorkerModule,
    CheckoutModule,
  ],
})
export class ApplicationModule {}
