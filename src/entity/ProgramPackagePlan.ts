import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProgramPackage } from './ProgramPackage';

@Index('program_package_plan_pkey', ['id'], { unique: true })
@Entity('program_package_plan', { schema: 'public' })
export class ProgramPackagePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'program_package_id' })
  programPackageId: string;

  @Column('boolean', { name: 'is_subscription' })
  isSubscription: boolean;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('numeric', { name: 'period_amount', nullable: true })
  periodAmount: number | null;

  @Column('text', { name: 'period_type', nullable: true })
  periodType: string | null;

  @Column('numeric', { name: 'list_price' })
  listPrice: number;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null;

  @Column('numeric', { name: 'discount_down_price', nullable: true })
  discountDownPrice: number | null;

  @Column('numeric', { name: 'position' })
  position: number;

  @Column('boolean', { name: 'is_tempo_delivery', default: () => false })
  isTempoDelivery: boolean;

  @Column('boolean', { name: 'is_participants_visible', default: () => true })
  isParticipantsVisible: boolean;

  @ManyToOne(() => ProgramPackage, (programPackage) => programPackage.programPackagePlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_package_id', referencedColumnName: 'id' }])
  programPackage: ProgramPackage;
}
