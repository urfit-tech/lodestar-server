import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Program } from './Program'
import { ProgramPackage } from './ProgramPackage'
import { ProgramTempoDelivery } from './ProgramTempoDelivery'

@Index('program_package_program_pkey', ['id'], { unique: true })
@Index('program_package_program_program_package_id_program_id_key', ['programId', 'programPackageId'], { unique: true })
@Entity('program_package_program', { schema: 'public' })
export class ProgramPackageProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_package_id', unique: true })
  programPackageId: string

  @Column('uuid', { name: 'program_id', unique: true })
  programId: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => Program, program => program.programPackagePrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program

  @ManyToOne(() => ProgramPackage, programPackage => programPackage.programPackagePrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_package_id', referencedColumnName: 'id' }])
  programPackage: ProgramPackage

  @OneToMany(() => ProgramTempoDelivery, programTempoDelivery => programTempoDelivery.programPackageProgram)
  programTempoDeliveries: ProgramTempoDelivery[]
}
