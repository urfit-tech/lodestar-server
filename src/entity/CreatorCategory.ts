import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Category } from '~/definition/entity/category.entity';
import { Member } from '~/member/entity/member.entity';

@Index('creator_category_pkey', ['id'], { unique: true })
@Entity('creator_category', { schema: 'public' })
export class CreatorCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'position', default: () => -1 })
  position: number

  @ManyToOne(() => Member, member => member.creatorCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'creator_id', referencedColumnName: 'id' }])
  creator: Member

  @ManyToOne(() => Category, category => category.creatorCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
