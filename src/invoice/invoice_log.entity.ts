import { Column, Entity, Index, JoinColumn, PrimaryColumn } from 'typeorm';
import { AppInvoiceGateway } from '~/entity/AppInvoiceGateway';

import { OrderLog } from '~/order/entity/order_log.entity';

@Index('invoice_log_pkey', ['merchantOrderNo'], { unique: true })
@Index('invoice_log_order_id_key', ['orderId'])
@Entity('invoice_log', { schema: 'public' })
export class InvoiceLog {
  @PrimaryColumn({ name: 'merchant_order_no' })
  merchantOrderNo: string;

  @Column('text', { name: 'status' })
  status: string;

  @Column('text', { name: 'message' })
  message: string;

  @Column('text', { name: 'app_invoice_gateway_id' })
  appInvoiceGatewayId: string;

  @Column('text', { name: 'order_id' })
  orderId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'invoice_number' })
  invoiceNumber: string;

  @Column('text', { name: 'invoice_trans_no' })
  invoiceTransNo: string;

  @Column('text', { name: 'invoice_random_number' })
  invoiceRandomNumber: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog;

  @JoinColumn([{ name: 'app_invoice_gateway_id', referencedColumnName: 'id' }])
  appInvoiceGateway: AppInvoiceGateway;
}
