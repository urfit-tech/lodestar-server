import { Logger, Module } from '@nestjs/common';

import { AppService } from '~/app/app.service';
import { OrderModule } from '~/order/order.module';
import { PaymentModule } from '~/payment/payment.module';
import { UtilityModule } from '~/utility/utility.module';

import { EzpayClient } from './ezpay_client';
import { InvoiceService } from './invocie.service';
import { InvoiceInfrastructure } from './invoice.infra';

@Module({
  imports: [OrderModule, PaymentModule, UtilityModule],
  providers: [Logger, EzpayClient, AppService, InvoiceService, InvoiceInfrastructure],
  exports: [EzpayClient, InvoiceService, InvoiceInfrastructure],
})
export class InvoiceModule {}
