import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { Post } from './Post'

@Index('post_role_pkey', ['id'], { unique: true })
@Index('post_id_member_id_key', ['memberId', 'postId'], {})
@Entity('post_role', { schema: 'public' })
export class PostRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'post_id' })
  postId: string

  @Column('text', { name: 'member_id' })
  memberId: string

  @Column('text', { name: 'name' })
  name: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => Member, member => member.postRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => Post, post => post.postRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'post_id', referencedColumnName: 'id' }])
  post: Post
}
