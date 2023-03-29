import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Merchandise } from './Merchandise'
import { Post } from './Post'

@Index('post_merchandise_pkey', ['id'], { unique: true })
@Entity('post_merchandise', { schema: 'public' })
export class PostMerchandise {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => Merchandise, merchandise => merchandise.postMerchandises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_id', referencedColumnName: 'id' }])
  merchandise: Merchandise

  @ManyToOne(() => Post, post => post.postMerchandises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'post_id', referencedColumnName: 'id' }])
  post: Post
}
