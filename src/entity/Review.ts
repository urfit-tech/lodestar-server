import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Member } from '~/member/entity/member.entity';

import { ReviewReaction } from './ReviewReaction';
import { ReviewReply } from './ReviewReply';

@Index('review_pkey', ['id'], { unique: true })
@Entity('review', { schema: 'public' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'path' })
  path: string;

  @Column('numeric', { name: 'score' })
  score: number;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'content', nullable: true })
  content: string | null;

  @Column('text', { name: 'private_content', nullable: true })
  privateContent: string | null;

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

  @Column('text', { name: 'app_id' })
  appId: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.reviews, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @OneToMany(() => ReviewReaction, (reviewReaction) => reviewReaction.review)
  reviewReactions: ReviewReaction[];

  @OneToMany(() => ReviewReply, (reviewReply) => reviewReply.review)
  reviewReplies: ReviewReply[];
}
