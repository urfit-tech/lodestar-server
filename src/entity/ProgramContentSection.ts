import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { Program } from './Program';

@Index('program_content_section_pkey', ['id'], { unique: true })
@Index('program_content_section_program_id', ['programId'], {})
@Entity('program_content_section', { schema: 'public' })
export class ProgramContentSection {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_id' })
  programId: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('integer', { name: 'position' })
  position: number

  @OneToMany(() => ProgramContent, programContent => programContent.contentSection)
  programContents: ProgramContent[]

  @ManyToOne(() => Program, program => program.programContentSections, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program
}
