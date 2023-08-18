import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BundleItem } from './BundleItem';

@Index('bundle_pkey', ['id'], { unique: true })
@Entity('bundle', { schema: 'public' })
export class Bundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('numeric', { name: 'salePrice' })
  salePrice: number;

  @Column('numeric', { name: 'listPrice' })
  listPrice: number;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null;

  @Column('integer', { name: 'type', default: () => 1 })
  type: number;

  @Column('text', { name: 'period_type', nullable: true })
  periodType: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @OneToMany(() => BundleItem, (bundleItem) => bundleItem.bundle)
  bundleItems: BundleItem[];
}
