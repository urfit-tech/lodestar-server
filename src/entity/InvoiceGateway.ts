import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { AppInvoiceGateway } from './AppInvoiceGateway';

@Index('invoice_gateway_pkey', ['id'], { unique: true })
@Entity('invoice_gateway', { schema: 'public' })
export class InvoiceGateway {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @OneToMany(() => AppInvoiceGateway, (appInvoiceGateway) => appInvoiceGateway.invoiceGateway)
  appInvoiceGateways: AppInvoiceGateway[];
}
