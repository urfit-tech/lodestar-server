import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './module/auth/auth.module'
import { CheckoutModule } from './module/checkout/checkout.module'
import { MemberModule } from './module/member/member.module'
import { UtilityModule } from './utility/utility.module'
import { VendorModule } from './module/vendor/vendor.module'
import { WorkerModule } from './module/worker/worker.module'

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
