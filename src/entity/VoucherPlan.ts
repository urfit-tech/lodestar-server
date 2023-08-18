import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { App } from './App';
import { VoucherCode } from './VoucherCode';
import { VoucherPlanProduct } from './VoucherPlanProduct';

@Index('voucher_plan_pkey', ['id'], { unique: true })
@Entity('voucher_plan', { schema: 'public' })
export class VoucherPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('integer', { name: 'product_quantity_limit', default: () => 1 })
  productQuantityLimit: number;

  @Column('boolean', { name: 'is_transferable', default: () => false })
  isTransferable: boolean;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('integer', { name: 'sale_amount', nullable: true })
  saleAmount: number | null;

  @Column('text', { name: 'editor_id', nullable: true })
  editorId: string | null;

  @OneToMany(() => VoucherCode, (voucherCode) => voucherCode.voucherPlan)
  voucherCodes: VoucherCode[];

  @ManyToOne(() => App, (app) => app.voucherPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @OneToMany(() => VoucherPlanProduct, (voucherPlanProduct) => voucherPlanProduct.voucherPlan)
  voucherPlanProducts: VoucherPlanProduct[];
}
