import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { App } from '~/app/entity/app.entity';
import { InvoiceGateway } from './InvoiceGateway';

@Index('app_invoice_gateway_pkey', ['id'], { unique: true })
@Entity('app_invoice_gateway', { schema: 'public' })
export class AppInvoiceGateway {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'gateway_id' })
  gatewayId: string;

  @Column('text', { name: 'app_id' })
  appId: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

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

  @ManyToOne(() => App, (app) => app.appInvoiceGateways, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => InvoiceGateway, (invoiceGateway) => invoiceGateway.appInvoiceGateways, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'gateway_id', referencedColumnName: 'id' }])
  invoiceGateway: InvoiceGateway;
}
