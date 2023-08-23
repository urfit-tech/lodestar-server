import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';

import { Member } from '~/member/entity/member.entity';
import { Coupon } from '~/entity/Coupon';
import { OrderContact } from '~/entity/OrderContact';
import { OrderDiscount } from '~/entity/OrderDiscount';
import { OrderExecutor } from '~/entity/OrderExecutor';
import { PaymentLog } from '~/payment/payment_log.entity';
import { Invoice } from '~/invoice/invoice.entity';

import { OrderProduct } from './order_product.entity';

@Index('order_log_started_at_desc', ['createdAt'], {})
@Index('order_log_custom_id_key', ['customId'], { unique: true })
@Index('order_log_id_key', ['id'], { unique: true })
@Index('order_log_pkey', ['id'], { unique: true })
@Index('order_log_member_id', ['memberId'], {})
@Index('order_log_status', ['status'], {})
@Entity('order_log', { schema: 'public' })
export class OrderLog {
  @PrimaryColumn({
    type: 'text',
    primary: true,
    unique: true,
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @Column('integer', { name: 'discount_type', default: () => 0 })
  discountType: number;

  @Column('numeric', { name: 'discount_point', default: () => 0 })
  discountPoint: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('jsonb', { name: 'invoice_options' })
  invoiceOptions: object;

  @Column('numeric', { name: 'discount_price', default: () => 0 })
  discountPrice: number;

  @Column('timestamp with time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('text', { name: 'message', nullable: true })
  message: string | null;

  @Column('jsonb', { name: 'payment_model', nullable: true })
  paymentModel: object | null;

  @Column('timestamp with time zone', { name: 'delivered_at', nullable: true })
  deliveredAt: Date | null;

  @Column('text', { name: 'deliver_message', nullable: true })
  deliverMessage: string | null;

  @Column('jsonb', { name: 'shipping', nullable: true })
  shipping: any | null;

  @Column('timestamp with time zone', { name: 'retried_at', nullable: true })
  retriedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'expired_at',
    nullable: true,
    default: () => "(now() + '3 days')",
  })
  expiredAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'auto_renewed_at',
    nullable: true,
  })
  autoRenewedAt: Date | null;

  @Column('text', { name: 'status', default: () => "'UNKNOWN'" })
  status: string;

  @Column('timestamp with time zone', { name: 'last_paid_at', nullable: true })
  lastPaidAt: Date | null;

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean;

  @Column('timestamp with time zone', {
    name: 'transferred_at',
    nullable: true,
  })
  transferredAt: Date | null;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('text', { name: 'custom_id', nullable: true, unique: true })
  customId: string | null;

  @Column('timestamp with time zone', {
    name: 'invoice_issued_at',
    nullable: true,
  })
  invoiceIssuedAt: Date | null;

  @OneToOne(() => Invoice, (invoice) => invoice.order)
  invoice: Invoice;

  @OneToMany(() => OrderContact, (orderContact) => orderContact.order)
  orderContacts: OrderContact[];

  @OneToMany(() => OrderDiscount, (orderDiscount) => orderDiscount.order)
  orderDiscounts: OrderDiscount[];

  @OneToMany(() => OrderExecutor, (orderExecutor) => orderExecutor.order)
  orderExecutors: OrderExecutor[];

  @ManyToOne(() => Coupon, (coupon) => coupon.orderLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'discount_coupon_id', referencedColumnName: 'id' }])
  discountCoupon: Coupon;

  @ManyToOne(() => Member, (member) => member.orderLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => OrderLog, (orderLog) => orderLog.orderLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'parent_order_id', referencedColumnName: 'id' }])
  parentOrder: OrderLog;

  @OneToMany(() => OrderLog, (orderLog) => orderLog.parentOrder)
  orderLogs: OrderLog[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order)
  orderProducts: OrderProduct[];

  @OneToMany(() => PaymentLog, (paymentLog) => paymentLog.order)
  paymentLogs: PaymentLog[];
}
