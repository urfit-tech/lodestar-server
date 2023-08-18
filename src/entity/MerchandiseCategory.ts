import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '~/definition/entity/category.entity';
import { Merchandise } from './Merchandise';

@Index('merchandise_category_pkey', ['id'], { unique: true })
@Entity('merchandise_category', { schema: 'public' })
export class MerchandiseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @ManyToOne(() => Merchandise, (merchandise) => merchandise.merchandiseCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_id', referencedColumnName: 'id' }])
  merchandise: Merchandise;

  @ManyToOne(() => Category, (category) => category.merchandiseCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category;
}
