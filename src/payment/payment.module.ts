import { Module } from '@nestjs/common';

import { AtomeService } from './atome/atome.service';
import { CwgService } from './cwg/cwg.service';
import { GatewayService } from './gateway/gateway.service';
import { NewebpayService } from './newebpay/newebpay.service';
import { PaypalService } from './paypal/paypal.service';
import { TappayService } from './tappay/tappay.service';
import { PaymentInfrastructure } from './payment.infra';

@Module({
  providers: [
    GatewayService,
    AtomeService,
    CwgService,
    PaypalService,
    NewebpayService,
    TappayService,
    PaymentInfrastructure,
  ],
  exports: [PaymentInfrastructure],
})
export class PaymentModule {}
