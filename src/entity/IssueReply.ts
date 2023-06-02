import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Issue } from './Issue'
import { IssueReplyReaction } from './IssueReplyReaction'
import { Member } from '~/member/entity/member.entity';

@Index('issue_reply_pkey', ['id'], { unique: true })
@Entity('issue_reply', { schema: 'public' })
export class IssueReply {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'content' })
  content: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => Issue, issue => issue.issueReplies, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'issue_id', referencedColumnName: 'id' }])
  issue: Issue

  @ManyToOne(() => Member, member => member.issueReplies, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => IssueReplyReaction, issueReplyReaction => issueReplyReaction.issueReply)
  issueReplyReactions: IssueReplyReaction[]
}
