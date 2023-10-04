import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { OrderLog } from '~/order/entity/order_log.entity';

@Index('order_discount_pkey', ['id'], { unique: true })
@Entity('order_discount', { schema: 'public' })
export class OrderDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'order_id' })
  orderId: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('numeric', { name: 'price' })
  price: number;

  @Column('text', { name: 'type' })
  type: string;

  @Column('text', { name: 'target' })
  target: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @ManyToOne(() => OrderLog, (orderLog) => orderLog.orderDiscounts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog;
}
