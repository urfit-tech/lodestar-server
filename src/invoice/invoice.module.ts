import { Module } from '@nestjs/common'

import { UtilityModule } from '~/utility/utility.module';

import { EzpayClient } from './ezpay_client';
import { InvoiceService } from './invocie.service';

@Module({
  imports: [UtilityModule],
  providers: [EzpayClient, InvoiceService],
  exports: [EzpayClient, InvoiceService],
})
export class InvoiceModule {}
