import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Activity } from './Activity'
import { Tag } from './Tag'

@Index('activity_tag_pkey', ['id'], { unique: true })
@Entity('activity_tag', { schema: 'public' })
export class ActivityTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'position' })
  position: number

  @ManyToOne(() => Activity, activity => activity.activityTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_id', referencedColumnName: 'id' }])
  activity: Activity

  @ManyToOne(() => Tag, tag => tag.activityTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'tag_name', referencedColumnName: 'name' }])
  tagName: Tag
}
