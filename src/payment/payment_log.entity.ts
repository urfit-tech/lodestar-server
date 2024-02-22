import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { OrderLog } from '~/order/entity/order_log.entity';
import { InvoiceGateway } from './invoice_gateway.entity';

@Index('payment_log_custom_no_key', ['customNo'], { unique: true })
@Index('payment_log_no_key', ['no'], { unique: true })
@Index('payment_log_pkey', ['no'], { unique: true })
@Entity('payment_log', { schema: 'public' })
export class PaymentLog {
  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { primary: true, name: 'no' })
  no: string;

  @Column('text', { name: 'order_id' })
  orderId: string;

  @Column('text', { name: 'status', nullable: true })
  status: string | null;

  @Column('numeric', { name: 'price', nullable: true })
  price: number | null;

  @Column('text', { name: 'gateway', nullable: true })
  gateway: string | null;

  @Column('jsonb', {
    name: 'options',
    nullable: true,
    default: () => 'jsonb_build_object()',
  })
  options: any | null;

  @Column('timestamp with time zone', {
    name: 'payment_due_at',
    nullable: true,
  })
  paymentDueAt: Date | null;

  @Column('timestamp with time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('timestamp with time zone', { name: 'paid_at', nullable: true })
  paidAt: Date | null;

  @Column('text', { name: 'method', nullable: true })
  method: string | null;

  @Column('text', { name: 'custom_no', nullable: true, unique: true })
  customNo: string | null;

  @Column('timestamp with time zone', {
    name: 'invoice_issued_at',
    nullable: true,
  })
  invoiceIssuedAt: Date | null;

  @Column('jsonb', {
    name: 'invoice_options',
    default: () => 'jsonb_build_object()',
  })
  invoiceOptions: object;

  @Column('uuid', {
    name: 'invoice_gateway_id'
  })
  invoiceGatewayId: string

  @ManyToOne(() => OrderLog, (orderLog) => orderLog.paymentLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog;
}
