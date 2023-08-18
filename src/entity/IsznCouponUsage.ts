import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('iszn_coupon_usage_pkey', ['unique'], { unique: true })
@Entity('iszn_coupon_usage', { schema: 'public' })
export class IsznCouponUsage {
  @Column('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'userid' })
  userid: string;

  @Column('text', { name: 'couponid' })
  couponid: string;

  @Column('timestamp with time zone', { name: 'addedat', nullable: true })
  addedat: Date | null;

  @Column('uuid', { name: 'orderid', nullable: true })
  orderid: string | null;

  @PrimaryColumn()
  unique: string;
}
