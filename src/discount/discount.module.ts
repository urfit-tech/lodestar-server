import { Module } from '@nestjs/common';
import { CouponModule } from '../coupon/coupon.module';
import { VoucherModule } from '../voucher/voucher.module';
import { CoinModule } from './coin/coin.module';
import { PointService } from './point/point.service';

@Module({
  imports: [CouponModule, VoucherModule, CoinModule],
  providers: [PointService],
})
export class DiscountModule {}
