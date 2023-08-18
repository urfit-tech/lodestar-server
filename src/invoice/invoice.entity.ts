import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { OrderLog } from '~/order/entity/order_log.entity';

@Index('invoice_pkey', ['no'], { unique: true })
@Index('invoice_order_id_key', ['orderId'], { unique: true })
@Entity('invoice', { schema: 'public' })
export class Invoice {
  @Column('text', { name: 'order_id', unique: true })
  orderId: string;

  @PrimaryColumn()
  no: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('numeric', { name: 'price', nullable: true })
  price: number | null;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('uuid', { name: 'executor_id', nullable: true })
  executorId: string | null;

  @OneToOne(() => OrderLog, (orderLog) => orderLog.invoice, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog;
}
