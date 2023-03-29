import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { SocialCard } from './SocialCard'

@Index('social_card_subscriber_pkey', ['id'], { unique: true })
@Entity('social_card_subscriber', { schema: 'public' })
export class SocialCardSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', nullable: true })
  memberId: string | null

  @Column('text', { name: 'member_channel_id', nullable: true })
  memberChannelId: string | null

  @Column('timestamp with time zone', {
    name: 'started_at',
    default: () => 'now()',
  })
  startedAt: Date

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => SocialCard, socialCard => socialCard.socialCardSubscribers, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'social_card_id', referencedColumnName: 'id' }])
  socialCard: SocialCard
}
