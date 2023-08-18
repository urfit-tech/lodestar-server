import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Member } from '~/member/entity/member.entity';

import { ProgramPackageProgram } from './ProgramPackageProgram';

@Index('program_tempo_delivery_pkey', ['id'], { unique: true })
@Index('program_tempo_delivery_member_id_program_package_program_id_key', ['memberId', 'programPackageProgramId'], {
  unique: true,
})
@Entity('program_tempo_delivery', { schema: 'public' })
export class ProgramTempoDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('uuid', { name: 'program_package_program_id', unique: true })
  programPackageProgramId: string;

  @Column('timestamp with time zone', { name: 'delivered_at' })
  deliveredAt: Date;

  @ManyToOne(() => Member, (member) => member.programTempoDeliveries, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => ProgramPackageProgram, (programPackageProgram) => programPackageProgram.programTempoDeliveries, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_package_program_id', referencedColumnName: 'id' }])
  programPackageProgram: ProgramPackageProgram;
}
