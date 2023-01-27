import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { CheckoutModule } from './checkout/checkout.module'
import { MemberModule } from './member/member.module'
import { UtilityModule } from './utility/utility.module'
import { VendorModule } from './vendor/vendor.module'
import { WorkerModule } from './worker/worker.module'

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    UtilityModule,
    MemberModule,
    AuthModule,
    VendorModule,
    WorkerModule,
    CheckoutModule,
  ],
})
export class AppModule {}
