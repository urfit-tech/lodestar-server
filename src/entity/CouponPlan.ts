import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CouponCode } from './CouponCode';
import { CouponPlanProduct } from './CouponPlanProduct';

@Index('coupon_plan_pkey', ['id'], { unique: true })
@Entity('coupon_plan', { schema: 'public' })
export class CouponPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('integer', { name: 'type', default: () => 1 })
  type: number;

  @Column('numeric', { name: 'constraint', nullable: true })
  constraint: number | null;

  @Column('numeric', { name: 'amount' })
  amount: number;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('jsonb', { name: 'scope', nullable: true })
  scope: object | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('text', { name: 'editor_id', nullable: true })
  editorId: string | null;

  @OneToMany(() => CouponCode, (couponCode) => couponCode.couponPlan)
  couponCodes: CouponCode[];

  @OneToMany(() => CouponPlanProduct, (couponPlanProduct) => couponPlanProduct.couponPlan)
  couponPlanProducts: CouponPlanProduct[];
}
