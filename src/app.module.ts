import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { CheckoutModule } from './modules/checkout/checkout.module'
import { MemberModule } from './modules/member/member.module'
import { UtilityModule } from './modules/utility/utility.module'
import { VendorModule } from './modules/vendor/vendor.module'
import { WorkerModule } from './modules/worker/worker.module'

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
