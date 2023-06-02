import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Activity } from './Activity'
import { Category } from '~/definition/entity/category.entity';

@Index('activity_category_pkey', ['id'], { unique: true })
@Entity('activity_category', { schema: 'public' })
export class ActivityCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'position' })
  position: number

  @ManyToOne(() => Activity, activity => activity.activityCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_id', referencedColumnName: 'id' }])
  activity: Activity

  @ManyToOne(() => Category, category => category.activityCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
