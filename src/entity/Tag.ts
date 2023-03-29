import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ActivityTag } from './ActivityTag'
import { MemberSpeciality } from './MemberSpeciality'
import { MemberTag } from './MemberTag'
import { MerchandiseTag } from './MerchandiseTag'
import { PodcastProgramTag } from './PodcastProgramTag'
import { PostTag } from './PostTag'
import { ProgramTag } from './ProgramTag'

@Index('tag_id_key', ['name'], { unique: true })
@Index('tag_pkey', ['name'], { unique: true })
@Entity('tag', { schema: 'public' })
export class Tag {
  @PrimaryGeneratedColumn()
  name: string

  @Column('text', { name: 'type' })
  type: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date

  @Column('boolean', { name: 'filterable', default: () => true })
  filterable: boolean

  @OneToMany(() => ActivityTag, activityTag => activityTag.tagName)
  activityTags: ActivityTag[]

  @OneToMany(() => MemberSpeciality, memberSpeciality => memberSpeciality.tagName)
  memberSpecialities: MemberSpeciality[]

  @OneToMany(() => MemberTag, memberTag => memberTag.tagName2)
  memberTags: MemberTag[]

  @OneToMany(() => MerchandiseTag, merchandiseTag => merchandiseTag.tagName)
  merchandiseTags: MerchandiseTag[]

  @OneToMany(() => PodcastProgramTag, podcastProgramTag => podcastProgramTag.tagName2)
  podcastProgramTags: PodcastProgramTag[]

  @OneToMany(() => PostTag, postTag => postTag.tagName)
  postTags: PostTag[]

  @OneToMany(() => ProgramTag, programTag => programTag.tagName2)
  programTags: ProgramTag[]
}
