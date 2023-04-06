import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Product } from './Product'
import { VoucherPlan } from './VoucherPlan'

@Index('voucher_plan_product_pkey', ['id'], { unique: true })
@Entity('voucher_plan_product', { schema: 'public' })
export class VoucherPlanProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Product, product => product.voucherPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product

  @ManyToOne(() => VoucherPlan, voucherPlan => voucherPlan.voucherPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'voucher_plan_id', referencedColumnName: 'id' }])
  voucherPlan: VoucherPlan
}
