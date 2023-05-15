import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { OrderProduct } from '~/order/entity/order_product.entity';

import { CardDiscount } from './CardDiscount'
import { CartProduct } from './CartProduct'
import { CouponPlanProduct } from './CouponPlanProduct'
import { GiftPlanProduct } from './GiftPlanProduct'
import { ProductChannel } from './ProductChannel'
import { ProductInventory } from './ProductInventory'
import { ProjectPlanProduct } from './ProjectPlanProduct'
import { VoucherPlanProduct } from './VoucherPlanProduct'

@Index('product_id_key', ['id'], { unique: true })
@Index('product_pkey', ['id'], { unique: true })
@Index('product_type_target', ['target', 'type'], {})
@Index('product_type', ['type'], {})
@Entity('product', { schema: 'public' })
export class Product {
  @PrimaryGeneratedColumn()
  id: string

  @Column('text', { name: 'type' })
  type: string

  @Column('text', { name: 'target' })
  target: string

  @Column('text', { name: 'sku', nullable: true })
  sku: string | null

  @Column('numeric', { name: 'coin_back', default: () => 0 })
  coinBack: number

  @Column('integer', { name: 'coin_period_amount', nullable: true })
  coinPeriodAmount: number | null

  @Column('text', { name: 'coin_period_type', nullable: true })
  coinPeriodType: string | null

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

  @OneToMany(() => CardDiscount, cardDiscount => cardDiscount.product)
  cardDiscounts: CardDiscount[]

  @OneToMany(() => CartProduct, cartProduct => cartProduct.product)
  cartProducts: CartProduct[]

  @OneToMany(() => CouponPlanProduct, couponPlanProduct => couponPlanProduct.product)
  couponPlanProducts: CouponPlanProduct[]

  @OneToMany(() => GiftPlanProduct, giftPlanProduct => giftPlanProduct.product)
  giftPlanProducts: GiftPlanProduct[]

  @OneToMany(() => OrderProduct, orderProduct => orderProduct.product)
  orderProducts: OrderProduct[]

  @OneToMany(() => ProductChannel, productChannel => productChannel.product)
  productChannels: ProductChannel[];

  @OneToMany(() => ProductInventory, productInventory => productInventory.product)
  productInventories: ProductInventory[]

  @OneToMany(() => ProjectPlanProduct, projectPlanProduct => projectPlanProduct.product)
  projectPlanProducts: ProjectPlanProduct[]

  @OneToMany(() => VoucherPlanProduct, voucherPlanProduct => voucherPlanProduct.product)
  voucherPlanProducts: VoucherPlanProduct[]
}
