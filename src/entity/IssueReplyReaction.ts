import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IssueReply } from './IssueReply';
import { Member } from '~/member/entity/member.entity';

@Index('issue_reply_reaction_pkey', ['id'], { unique: true })
@Entity('issue_reply_reaction', { schema: 'public' })
export class IssueReplyReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @ManyToOne(() => IssueReply, (issueReply) => issueReply.issueReplyReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'issue_reply_id', referencedColumnName: 'id' }])
  issueReply: IssueReply;

  @ManyToOne(() => Member, (member) => member.issueReplyReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
