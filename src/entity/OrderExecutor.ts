import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { OrderLog } from '~/order/entity/order_log.entity';

import { Member } from '~/member/entity/member.entity';

@Index('order_executor_pkey', ['id'], { unique: true })
@Entity('order_executor', { schema: 'public' })
export class OrderExecutor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('numeric', { name: 'ratio', default: () => 1 })
  ratio: number;

  @ManyToOne(() => Member, (member) => member.orderExecutors, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => OrderLog, (orderLog) => orderLog.orderExecutors, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog;
}
