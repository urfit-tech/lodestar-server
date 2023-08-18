import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('app_page_template_author_id_name_key', ['authorId', 'name'], {
  unique: true,
})
@Index('app_page_template_pkey', ['id'], { unique: true })
@Entity('app_page_template', { schema: 'public' })
export class AppPageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'root_node_id' })
  rootNodeId: string;

  @Column('jsonb', { name: 'data' })
  data: object;

  @Column('text', { name: 'author_id', unique: true })
  authorId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('text', { name: 'name', unique: true, default: () => 'now()' })
  name: string;

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null;

  @ManyToOne(() => Member, (member) => member.appPageTemplates, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'author_id', referencedColumnName: 'id' }])
  author: Member;
}
