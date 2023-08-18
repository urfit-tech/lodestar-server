import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '~/definition/entity/category.entity';
import { Post } from './Post';

@Index('post_id_category_id_key', ['categoryId', 'postId'], {})
@Index('post_category_pkey', ['id'], { unique: true })
@Entity('post_category', { schema: 'public' })
export class PostCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'post_id' })
  postId: string;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @Column('text', { name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Post, (post) => post.postCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'post_id', referencedColumnName: 'id' }])
  post: Post;

  @ManyToOne(() => Category, (category) => category.postCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category;
}
