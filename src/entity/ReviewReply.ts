import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Review } from './Review';

@Index('review_reply_pkey', ['id'], { unique: true })
@Entity('review_reply', { schema: 'public' })
export class ReviewReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @Column('text', { name: 'content', nullable: true })
  content: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => Review, (review) => review.reviewReplies, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'review_id', referencedColumnName: 'id' }])
  review: Review;
}
