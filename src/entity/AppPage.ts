import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AppPageSection } from './AppPageSection';
import { Member } from '~/member/entity/member.entity';

@Index('app_page_path_app_id_is_deleted_key', ['appId', 'isDeleted', 'path'], {
  unique: true,
})
@Index('app_page_pkey', ['id'], { unique: true })
@Entity('app_page', { schema: 'public' })
export class AppPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'path', nullable: true, unique: true })
  path: string | null;

  @Column('text', { name: 'app_id', unique: true })
  appId: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('text', { name: 'title', nullable: true })
  title: string | null;

  @Column('jsonb', { name: 'craft_data', nullable: true })
  craftData: object | null;

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

  @Column('boolean', {
    name: 'is_deleted',
    unique: true,
    default: () => false,
  })
  isDeleted: boolean;

  @Column('jsonb', { name: 'meta_tag', nullable: true })
  metaTag: object | null;

  @ManyToOne(() => Member, (member) => member.appPages, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'editor_id', referencedColumnName: 'id' }])
  editor: Member;

  @OneToMany(() => AppPageSection, (appPageSection) => appPageSection.appPage)
  appPageSections: AppPageSection[];
}
