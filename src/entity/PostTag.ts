import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Tag } from '~/definition/entity/tag.entity';

import { Post } from './Post';

@Index('post_tag_pkey', ['id'], { unique: true })
@Entity('post_tag', { schema: 'public' })
export class PostTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @ManyToOne(() => Post, (post) => post.postTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'post_id', referencedColumnName: 'id' }])
  post: Post;

  @ManyToOne(() => Tag, (tag) => tag.postTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'tag_name', referencedColumnName: 'name' }])
  tagName: Tag;
}
