import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('program_package_tag_pkey', ['id'], { unique: true })
@Index('program_package_tag_program_package_id_tag_name_key', ['programPackageId', 'tagName'], { unique: true })
@Entity('program_package_tag', { schema: 'public' })
export class ProgramPackageTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_package_id', unique: true })
  programPackageId: string

  @Column('text', { name: 'tag_name', unique: true })
  tagName: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number
}
