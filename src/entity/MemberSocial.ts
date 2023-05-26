import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from '~/member/entity/member.entity';
import { SocialCard } from './SocialCard'

@Index('member_social_type_channel_id_key', ['channelId', 'type'], {
  unique: true,
})
@Index('member_social_pkey', ['id'], { unique: true })
@Entity('member_social', { schema: 'public' })
export class MemberSocial {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'type', unique: true })
  type: string

  @Column('text', { name: 'channel_id', unique: true })
  channelId: string

  @Column('text', { name: 'channel_url', nullable: true })
  channelUrl: string | null

  @Column('text', { name: 'name' })
  name: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('text', { name: 'profile_url', nullable: true })
  profileUrl: string | null

  @ManyToOne(() => Member, member => member.memberSocials, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => SocialCard, socialCard => socialCard.memberSocial)
  socialCards: SocialCard[]
}
