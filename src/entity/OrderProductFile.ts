import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OrderProduct } from './OrderProduct'

@Index('order_product_file_pkey', ['id'], { unique: true })
@Entity('order_product_file', { schema: 'public' })
export class OrderProductFile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('jsonb', { name: 'data', nullable: true })
  data: object | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date

  @ManyToOne(() => OrderProduct, orderProduct => orderProduct.orderProductFiles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_product_id', referencedColumnName: 'id' }])
  orderProduct: OrderProduct
}
