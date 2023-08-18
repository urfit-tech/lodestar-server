import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('iszn_order_pkey', ['id'], { unique: true })
@Entity('iszn_order', { schema: 'public' })
export class IsznOrder {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'status' })
  status: string;

  @Column('text', { name: 'userid' })
  userid: string;

  @Column('timestamp with time zone', { name: 'createdat' })
  createdat: Date;

  @Column('timestamp with time zone', { name: 'updatedat' })
  updatedat: Date;

  @Column('text', { name: 'paymenttype', nullable: true })
  paymenttype: string | null;

  @Column('text', { name: 'merchantorderno', nullable: true })
  merchantorderno: string | null;

  @Column('uuid', { name: 'invoiceid', nullable: true })
  invoiceid: string | null;

  @Column('text', { name: 'message', nullable: true })
  message: string | null;

  @Column('bigint', { name: 'totalamount', nullable: true })
  totalamount: string | null;
}
