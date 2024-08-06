import { ViewEntity, ViewColumn, OneToOne, JoinColumn } from 'typeorm';
import { Coupon } from './coupon.entity';

@ViewEntity({
  name: 'coupon_status',
})
export class CouponStatus {
  @ViewColumn()
  coupon_id: string;

  @ViewColumn()
  outdated: boolean;

  @ViewColumn()
  used: boolean;

  @OneToOne(() => Coupon, (coupon) => coupon.couponStatus)
  @JoinColumn({ name: 'coupon_id', referencedColumnName: 'id' })
  coupon: Coupon;
}
