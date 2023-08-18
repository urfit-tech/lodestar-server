import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GiftPlan } from './GiftPlan';

@Index('product_gift_plan_pkey', ['id'], { unique: true })
@Entity('product_gift_plan', { schema: 'public' })
export class ProductGiftPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'product_id' })
  productId: string;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

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

  @ManyToOne(() => GiftPlan, (giftPlan) => giftPlan.productGiftPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'gift_plan_id', referencedColumnName: 'id' }])
  giftPlan: GiftPlan;
}
