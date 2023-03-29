import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('search_tag_tag_name_app_id_key', ['appId', 'tagName'], { unique: true })
@Index('search_tag_pkey', ['id'], { unique: true })
@Entity('search_tag', { schema: 'public' })
export class SearchTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'tag_name', unique: true })
  tagName: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @Column('text', { name: 'app_id', unique: true })
  appId: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date
}
