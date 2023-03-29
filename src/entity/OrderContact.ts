import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { OrderLog } from './OrderLog'

@Index('order_contact_pkey', ['id'], { unique: true })
@Entity('order_contact', { schema: 'public' })
export class OrderContact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'message' })
  message: string

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

  @Column('timestamp with time zone', { name: 'read_at', nullable: true })
  readAt: Date | null

  @ManyToOne(() => Member, member => member.orderContacts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => OrderLog, orderLog => orderLog.orderContacts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog
}
