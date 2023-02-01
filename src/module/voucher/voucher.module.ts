import { Module } from '@nestjs/common'
import { VoucherPlanService } from './voucher-plan/voucher-plan.service'

@Module({
  providers: [VoucherPlanService],
})
export class VoucherModule {}
