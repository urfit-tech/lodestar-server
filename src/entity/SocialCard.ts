import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MemberSocial } from './MemberSocial';
import { SocialCardSubscriber } from './SocialCardSubscriber';

@Index('social_card_pkey', ['id'], { unique: true })
@Entity('social_card', { schema: 'public' })
export class SocialCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'membership_id', nullable: true })
  membershipId: string | null;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'badge_url', nullable: true })
  badgeUrl: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @ManyToOne(() => MemberSocial, (memberSocial) => memberSocial.socialCards, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_social_id', referencedColumnName: 'id' }])
  memberSocial: MemberSocial;

  @OneToMany(() => SocialCardSubscriber, (socialCardSubscriber) => socialCardSubscriber.socialCard)
  socialCardSubscribers: SocialCardSubscriber[];
}
