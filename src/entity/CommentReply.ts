import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './Comment';
import { CommentReplyReaction } from './CommentReplyReaction';
import { Member } from '~/member/entity/member.entity';

@Index('comment_reply_pkey', ['id'], { unique: true })
@Entity('comment_reply', { schema: 'public' })
export class CommentReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'content' })
  content: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => Comment, (comment) => comment.commentReplies, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'comment_id', referencedColumnName: 'id' }])
  comment: Comment;

  @ManyToOne(() => Member, (member) => member.commentReplies, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @OneToMany(() => CommentReplyReaction, (commentReplyReaction) => commentReplyReaction.commentReply)
  commentReplyReactions: CommentReplyReaction[];
}
