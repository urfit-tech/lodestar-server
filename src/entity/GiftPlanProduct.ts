import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { GiftPlan } from './GiftPlan'
import { Product } from './Product'

@Index('gift_plan_product_pkey', ['id'], { unique: true })
@Entity('gift_plan_product', { schema: 'public' })
export class GiftPlanProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => GiftPlan, giftPlan => giftPlan.giftPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'gift_plan_id', referencedColumnName: 'id' }])
  giftPlan: GiftPlan

  @ManyToOne(() => Product, product => product.giftPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product
}
