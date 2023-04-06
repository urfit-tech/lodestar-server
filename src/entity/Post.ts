import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'
import { PostCategory } from './PostCategory'
import { PostMerchandise } from './PostMerchandise'
import { PostRole } from './PostRole'
import { PostTag } from './PostTag'

@Index('post_pkey', ['id'], { unique: true })
@Entity('post', { schema: 'public' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @Column('text', { name: 'video_url', nullable: true })
  videoUrl: string | null

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('integer', { name: 'views', default: () => 0 })
  views: number

  @Column('integer', { name: 'position', default: () => -1 })
  position: number

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @Column('text', { name: 'code_name', nullable: true })
  codeName: string | null

  @Column('text', { name: 'source', nullable: true })
  source: string | null

  @Column('jsonb', { name: 'meta_tag', nullable: true })
  metaTag: object | null

  @Column('timestamp with time zone', { name: 'pinned_at', nullable: true })
  pinnedAt: Date | null

  @ManyToOne(() => App, app => app.posts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @OneToMany(() => PostCategory, postCategory => postCategory.post)
  postCategories: PostCategory[]

  @OneToMany(() => PostMerchandise, postMerchandise => postMerchandise.post)
  postMerchandises: PostMerchandise[]

  @OneToMany(() => PostRole, postRole => postRole.post)
  postRoles: PostRole[]

  @OneToMany(() => PostTag, postTag => postTag.post)
  postTags: PostTag[]
}
