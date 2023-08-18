import { Module } from '@nestjs/common';
import { CouponModule } from '../coupon/coupon.module';
import { VoucherModule } from '../voucher/voucher.module';
import { CardService } from './card/card.service';
import { CoinService } from './coin/coin.service';
import { PointService } from './point/point.service';

@Module({
  imports: [CouponModule, VoucherModule],
  providers: [CardService, CoinService, PointService],
})
export class DiscountModule {}
