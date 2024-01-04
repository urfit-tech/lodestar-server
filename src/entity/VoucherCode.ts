import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Voucher } from '../voucher/entity/voucher.entity';
import { VoucherPlan } from './VoucherPlan';

@Index('voucher_code_code_key', ['code'], { unique: true })
@Index('voucher_code_pkey', ['id'], { unique: true })
@Entity('voucher_code', { schema: 'public' })
export class VoucherCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'voucher_plan_id' })
  voucherPlanId: string;

  @Column('text', { name: 'code', unique: true })
  code: string;

  @Column('integer', { name: 'count' })
  count: number;

  @Column('integer', { name: 'remaining' })
  remaining: number;

  @Column('timestamp without time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Voucher, (voucher) => voucher.voucherCode)
  vouchers: Voucher[];

  @ManyToOne(() => VoucherPlan, (voucherPlan) => voucherPlan.voucherCodes, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'voucher_plan_id', referencedColumnName: 'id' }])
  voucherPlan: VoucherPlan;
}
