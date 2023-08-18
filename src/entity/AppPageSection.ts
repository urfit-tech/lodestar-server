import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AppPage } from './AppPage';

@Index('app_page_section_pkey', ['id'], { unique: true })
@Entity('app_page_section', { schema: 'public' })
export class AppPageSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('numeric', { name: 'position', nullable: true })
  position: number | null;

  @ManyToOne(() => AppPage, (appPage) => appPage.appPageSections, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_page_id', referencedColumnName: 'id' }])
  appPage: AppPage;
}
