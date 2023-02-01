import { Module } from '@nestjs/common'
import { AtomeService } from './atome/atome.service'
import { CwgService } from './cwg/cwg.service'
import { GatewayService } from './gateway/gateway.service'
import { NewebpayService } from './newebpay/newebpay.service'
import { PaypalService } from './paypal/paypal.service'
import { TappayService } from './tappay/tappay.service'

@Module({
  imports: [],
  providers: [GatewayService, AtomeService, CwgService, PaypalService, NewebpayService, TappayService],
})
export class PaymentModule {}
