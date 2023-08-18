import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Member } from '~/member/entity/member.entity';

import { Review } from './Review';

@Index('review_reaction_pkey', ['id'], { unique: true })
@Index('review_reaction_review_id_member_id_key', ['memberId', 'reviewId'], {
  unique: true,
})
@Entity('review_reaction', { schema: 'public' })
export class ReviewReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'review_id', unique: true })
  reviewId: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => Member, (member) => member.reviewReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => Review, (review) => review.reviewReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'review_id', referencedColumnName: 'id' }])
  review: Review;
}
