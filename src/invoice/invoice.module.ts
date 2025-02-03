import { Logger, Module } from '@nestjs/common';

import { AppModule } from '~/app/app.module';
import { OrderModule } from '~/order/order.module';
import { PaymentModule } from '~/payment/payment.module';
import { UtilityModule } from '~/utility/utility.module';

import { EzpayClient } from './ezpay_client';
import { InvoiceService } from './invoice.service';
import { InvoiceInfrastructure } from './invoice.infra';
import { InvoiceController } from './invoice.controller';
import { AuthModule } from '~/auth/auth.module';
import { PaymentService } from '~/payment/payment.service';
import { InvoiceLogInfrastructure } from './invoice_log.infra';

@Module({
  controllers: [InvoiceController],
  imports: [AuthModule, AppModule, OrderModule, PaymentModule, UtilityModule],
  providers: [Logger, EzpayClient, InvoiceService, InvoiceInfrastructure, InvoiceLogInfrastructure, PaymentService],
  exports: [EzpayClient, InvoiceService, InvoiceInfrastructure],
})
export class InvoiceModule {}
