import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('iszn_coupon_pkey', ['id'], { unique: true })
@Entity('iszn_coupon', { schema: 'public' })
export class IsznCoupon {
  @Column('timestamp with time zone', { name: 'startedat', nullable: true })
  startedat: Date | null;

  @Column('timestamp with time zone', { name: 'endedat', nullable: true })
  endedat: Date | null;

  @Column('integer', { name: 'amount' })
  amount: number;

  @Column('integer', { name: 'count' })
  count: number;

  @Column('integer', { name: 'constraint', nullable: true })
  constraint: number | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('integer', { name: 'type', nullable: true })
  type: number | null;
}
