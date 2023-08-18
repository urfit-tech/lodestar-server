import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './Project';

@Index('project_section_pkey', ['id'], { unique: true })
@Entity('project_section', { schema: 'public' })
export class ProjectSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('integer', { name: 'position', nullable: true })
  position: number | null;

  @ManyToOne(() => Project, (project) => project.projectSections, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'id' }])
  project: Project;
}
