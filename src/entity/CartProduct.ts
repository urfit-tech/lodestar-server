import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Product } from './Product'

@Index('cart_product_pkey', ['id'], { unique: true })
@Entity('cart_product', { schema: 'public' })
export class CartProduct {
  @Column('text', { name: 'member_id' })
  memberId: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @ManyToOne(() => Product, product => product.cartProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product
}
