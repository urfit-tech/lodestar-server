import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Coupon } from './Coupon';
import { CouponPlan } from './CouponPlan';

@Index('coupon_plan_code_app_id_code_key', ['appId', 'code'], { unique: true })
@Index('coupon_plan_code_pkey', ['id'], { unique: true })
@Entity('coupon_code', { schema: 'public' })
export class CouponCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'code', unique: true })
  code: string;

  @Column('integer', { name: 'count' })
  count: number;

  @Column('text', { name: 'app_id', unique: true })
  appId: string;

  @Column('integer', { name: 'remaining' })
  remaining: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @OneToMany(() => Coupon, (coupon) => coupon.couponCode)
  coupons: Coupon[];

  @ManyToOne(() => CouponPlan, (couponPlan) => couponPlan.couponCodes, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'coupon_plan_id', referencedColumnName: 'id' }])
  couponPlan: CouponPlan;
}
