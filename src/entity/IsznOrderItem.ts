import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('iszn_order_item_pkey', ['id'], { unique: true })
@Entity('iszn_order_item', { schema: 'public' })
export class IsznOrderItem {
  @PrimaryColumn()
  id: string

  @Column('uuid', { name: 'orderid' })
  orderid: string

  @Column('uuid', { name: 'courseid' })
  courseid: string
}
