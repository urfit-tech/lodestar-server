import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bundle } from './Bundle';

@Index('bundle_item_pkey', ['id'], { unique: true })
@Entity('bundle_item', { schema: 'public' })
export class BundleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'class' })
  class: string;

  @Column('jsonb', { name: 'target' })
  target: object;

  @ManyToOne(() => Bundle, (bundle) => bundle.bundleItems, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'bundle_id', referencedColumnName: 'id' }])
  bundle: Bundle;
}
