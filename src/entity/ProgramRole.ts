import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { Program } from './Program'

@Index('program_role_pkey', ['id'], { unique: true })
@Index('program_role_name_program_id_member_id_key', ['memberId', 'name', 'programId'], { unique: true })
@Index('program_role_program_id', ['programId'], {})
@Entity('program_role', { schema: 'public' })
export class ProgramRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_id', unique: true })
  programId: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('text', { name: 'name', unique: true })
  name: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => Member, member => member.programRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => Program, program => program.programRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program
}
