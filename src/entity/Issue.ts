import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

import { IssueReaction } from './IssueReaction';
import { IssueReply } from './IssueReply';
import { Member } from './Member';

@Index('issue_pkey', ['id'], { unique: true })
@Entity('issue', { schema: 'public' })
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'thread_id' })
  threadId: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description' })
  description: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', { name: 'solved_at', nullable: true })
  solvedAt: Date | null

  @Column('boolean', { name: 'is_public', default: () => false })
  isPublic: boolean

  @ManyToOne(() => App, app => app.issues, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => Member, member => member.issues, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => IssueReaction, issueReaction => issueReaction.issue)
  issueReactions: IssueReaction[]

  @OneToMany(() => IssueReply, issueReply => issueReply.issue)
  issueReplies: IssueReply[]
}
