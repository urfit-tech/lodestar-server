import { Module } from '@nestjs/common';
import { VoucherPlanService } from './voucher-plan/voucher-plan.service';
import { VoucherInfrastructure } from './voucher.infra';

@Module({
  providers: [VoucherPlanService, VoucherInfrastructure],
  exports: [VoucherInfrastructure],
})
export class VoucherModule {}
