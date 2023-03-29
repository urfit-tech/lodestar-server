import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { GiftPlanProduct } from './GiftPlanProduct'
import { ProductGiftPlan } from './ProductGiftPlan'

@Index('gift_plan_pkey', ['id'], { unique: true })
@Entity('gift_plan', { schema: 'public' })
export class GiftPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'editor_id' })
  editorId: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @OneToMany(() => GiftPlanProduct, giftPlanProduct => giftPlanProduct.giftPlan)
  giftPlanProducts: GiftPlanProduct[]

  @OneToMany(() => ProductGiftPlan, productGiftPlan => productGiftPlan.giftPlan)
  productGiftPlans: ProductGiftPlan[]
}
