import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { OrderProduct } from '~/order/entity/order_product.entity';

import { ActivitySession } from './ActivitySession'

@Index('activity_attendance_order_product_id_activity_session_id_key', ['activitySessionId', 'orderProductId'], {
  unique: true,
})
@Index('activity_attendance_pkey', ['id'], { unique: true })
@Entity('activity_attendance', { schema: 'public' })
export class ActivityAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'order_product_id', unique: true })
  orderProductId: string

  @Column('uuid', { name: 'activity_session_id', unique: true })
  activitySessionId: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => ActivitySession, activitySession => activitySession.activityAttendances, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_session_id', referencedColumnName: 'id' }])
  activitySession: ActivitySession

  @ManyToOne(() => OrderProduct, orderProduct => orderProduct.activityAttendances, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_product_id', referencedColumnName: 'id' }])
  orderProduct: OrderProduct
}
