import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { Program } from './Program'

@Index('program_timetable_pkey', ['id'], { unique: true })
@Entity('program_timetable', { schema: 'public' })
export class ProgramTimetable {
  @Column('timestamp with time zone', { name: 'time' })
  time: Date

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

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

  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Member, member => member.programTimetables, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => Program, program => program.programTimetables, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program
}
