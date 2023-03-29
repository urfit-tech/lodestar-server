import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { Podcast } from './Podcast'

@Index('podcast_plan_pkey', ['id'], { unique: true })
@Entity('podcast_plan', { schema: 'public' })
export class PodcastPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('boolean', { name: 'is_subscription' })
  isSubscription: boolean

  @Column('text', { name: 'title' })
  title: string

  @Column('numeric', { name: 'list_price' })
  listPrice: number

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('numeric', { name: 'period_amount' })
  periodAmount: number

  @Column('text', { name: 'period_type' })
  periodType: string

  @Column('integer', { name: 'position', nullable: true })
  position: number | null

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

  @ManyToOne(() => Member, member => member.podcastPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'creator_id', referencedColumnName: 'id' }])
  creator: Member

  @ManyToOne(() => Podcast, podcast => podcast.podcastPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_id', referencedColumnName: 'id' }])
  podcast: Podcast
}
