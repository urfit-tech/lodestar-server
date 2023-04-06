import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'
import { CommentReaction } from './CommentReaction'
import { CommentReply } from './CommentReply'
import { Member } from './Member'

@Index('comment_pkey', ['id'], { unique: true })
@Entity('comment', { schema: 'public' })
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'thread_id' })
  threadId: string

  @Column('text', { name: 'content' })
  content: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => App, app => app.comments, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => Member, member => member.comments, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => CommentReaction, commentReaction => commentReaction.comment)
  commentReactions: CommentReaction[]

  @OneToMany(() => CommentReply, commentReply => commentReply.comment)
  commentReplies: CommentReply[]
}
