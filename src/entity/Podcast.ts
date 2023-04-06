import { Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'
import { Member } from './Member'
import { PodcastPlan } from './PodcastPlan'
import { PodcastProgram } from './PodcastProgram'

@Index('podcast_pkey', ['id'], { unique: true })
@Entity('podcast', { schema: 'public' })
export class Podcast {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => App, app => app.podcasts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => Member, member => member.podcasts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'instructor_id', referencedColumnName: 'id' }])
  instructor: Member

  @OneToMany(() => PodcastPlan, podcastPlan => podcastPlan.podcast)
  podcastPlans: PodcastPlan[]

  @OneToMany(() => PodcastProgram, podcastProgram => podcastProgram.podcast)
  podcastPrograms: PodcastProgram[]
}
