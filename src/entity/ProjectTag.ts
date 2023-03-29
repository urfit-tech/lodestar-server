import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('project_tag_pkey', ['id'], { unique: true })
@Index('project_tag_project_id_tag_name_key', ['projectId', 'tagName'], {
  unique: true,
})
@Entity('project_tag', { schema: 'public' })
export class ProjectTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'project_id', unique: true })
  projectId: string

  @Column('text', { name: 'tag_name', unique: true })
  tagName: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number
}
