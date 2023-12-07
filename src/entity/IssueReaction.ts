import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Issue } from './Issue';
import { Member } from '~/member/entity/member.entity';

@Index('issue_reaction_pkey', ['id'], { unique: true })
@Entity('issue_reaction', { schema: 'public' })
export class IssueReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @ManyToOne(() => Issue, (issue) => issue.issueReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'issue_id', referencedColumnName: 'id' }])
  issue: Issue;

  @ManyToOne(() => Member, (member) => member.issueReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
