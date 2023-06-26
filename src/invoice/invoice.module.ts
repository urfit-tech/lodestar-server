import { Module } from '@nestjs/common';

import { OrderModule } from '~/order/order.module';
import { PaymentModule } from '~/payment/payment.module';
import { UtilityModule } from '~/utility/utility.module';

import { EzpayClient } from './ezpay_client';
import { InvoiceService } from './invocie.service';
import { InvoiceInfrastructure } from './invoice.infra';

@Module({
  imports: [OrderModule, PaymentModule, UtilityModule],
  providers: [EzpayClient, InvoiceService, InvoiceInfrastructure],
  exports: [EzpayClient, InvoiceService, InvoiceInfrastructure],
})
export class InvoiceModule {}
