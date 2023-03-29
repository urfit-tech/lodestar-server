import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('iszn_invoice_pkey', ['id'], { unique: true })
@Entity('iszn_invoice', { schema: 'public' })
export class IsznInvoice {
  @Column('text', { name: 'buyername' })
  buyername: string

  @Column('text', { name: 'buyerubn' })
  buyerubn: string

  @Column('text', { name: 'buyeraddress' })
  buyeraddress: string

  @Column('text', { name: 'buyeremail' })
  buyeremail: string

  @Column('text', { name: 'category' })
  category: string

  @Column('text', { name: 'carriertype' })
  carriertype: string

  @Column('text', { name: 'carriernum' })
  carriernum: string

  @Column('text', { name: 'lovecode' })
  lovecode: string

  @PrimaryColumn()
  id: string
}
