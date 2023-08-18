import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommentReply } from './CommentReply';
import { Member } from '~/member/entity/member.entity';

@Index('comment_reply_reaction_pkey', ['id'], { unique: true })
@Entity('comment_reply_reaction', { schema: 'public' })
export class CommentReplyReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => CommentReply, (commentReply) => commentReply.commentReplyReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'comment_reply_id', referencedColumnName: 'id' }])
  commentReply: CommentReply;

  @ManyToOne(() => Member, (member) => member.commentReplyReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
