import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Comment } from './Comment'
import { Member } from './Member'

@Index('comment_reaction_pkey', ['id'], { unique: true })
@Entity('comment_reaction', { schema: 'public' })
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => Comment, comment => comment.commentReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'comment_id', referencedColumnName: 'id' }])
  comment: Comment

  @ManyToOne(() => Member, member => member.commentReactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member
}
