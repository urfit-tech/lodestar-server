import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ActivityCategory } from './ActivityCategory'
import { CreatorCategory } from './CreatorCategory'
import { MemberCategory } from './MemberCategory'
import { MemberTask } from './MemberTask'
import { MerchandiseCategory } from './MerchandiseCategory'
import { PodcastAlbumCategory } from './PodcastAlbumCategory'
import { PodcastProgramCategory } from './PodcastProgramCategory'
import { PostCategory } from './PostCategory'
import { ProgramCategory } from './ProgramCategory'
import { ProgramPackageCategory } from './ProgramPackageCategory'
import { ProjectCategory } from './ProjectCategory'

@Index('category_app_id_class_name_key', ['appId', 'class', 'name'], {
  unique: true,
})
@Index('category_id_key', ['id'], { unique: true })
@Index('category_pkey', ['id'], { unique: true })
@Entity('category', { schema: 'public' })
export class Category {
  @Column('text', { name: 'name', unique: true })
  name: string

  @Column('text', { name: 'class', unique: true })
  class: string

  @Column('integer', { name: 'position' })
  position: number

  @Column('text', { name: 'app_id', unique: true })
  appId: string

  @PrimaryGeneratedColumn()
  id: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @Column('boolean', { name: 'filterable', default: () => true })
  filterable: boolean

  @OneToMany(() => ActivityCategory, activityCategory => activityCategory.category)
  activityCategories: ActivityCategory[]

  @OneToMany(() => CreatorCategory, creatorCategory => creatorCategory.category)
  creatorCategories: CreatorCategory[]

  @OneToMany(() => MemberCategory, memberCategory => memberCategory.category)
  memberCategories: MemberCategory[]

  @OneToMany(() => MemberTask, memberTask => memberTask.category)
  memberTasks: MemberTask[]

  @OneToMany(() => MerchandiseCategory, merchandiseCategory => merchandiseCategory.category)
  merchandiseCategories: MerchandiseCategory[]

  @OneToMany(() => PodcastAlbumCategory, podcastAlbumCategory => podcastAlbumCategory.category)
  podcastAlbumCategories: PodcastAlbumCategory[]

  @OneToMany(() => PodcastProgramCategory, podcastProgramCategory => podcastProgramCategory.category)
  podcastProgramCategories: PodcastProgramCategory[]

  @OneToMany(() => PostCategory, postCategory => postCategory.category)
  postCategories: PostCategory[]

  @OneToMany(() => ProgramCategory, programCategory => programCategory.category)
  programCategories: ProgramCategory[]

  @OneToMany(() => ProgramPackageCategory, programPackageCategory => programPackageCategory.category)
  programPackageCategories: ProgramPackageCategory[]

  @OneToMany(() => ProjectCategory, projectCategory => projectCategory.category)
  projectCategories: ProjectCategory[]
}
