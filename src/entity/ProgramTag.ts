import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Program } from './program'
import { Tag } from './Tag'

@Index('program_tag_pkey', ['id'], { unique: true })
@Index('program_tag_program_id_tag_name_key', ['programId', 'tagName'], {
  unique: true,
})
@Entity('program_tag', { schema: 'public' })
export class ProgramTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_id' })
  programId: string

  @Column('text', { name: 'tag_name' })
  tagName: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => Program, program => program.programTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program

  @ManyToOne(() => Tag, tag => tag.programTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'tag_name', referencedColumnName: 'name' }])
  tagName2: Tag
}
