import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CouponPlan } from './CouponPlan';
import { Product } from './Product';

@Index('coupon_plan_product_pkey', ['id'], { unique: true })
@Entity('coupon_plan_product', { schema: 'public' })
export class CouponPlanProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CouponPlan, (couponPlan) => couponPlan.couponPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'coupon_plan_id', referencedColumnName: 'id' }])
  couponPlan: CouponPlan;

  @ManyToOne(() => Product, (product) => product.couponPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product;
}
