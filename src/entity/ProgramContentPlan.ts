import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { ProgramPlan } from './ProgramPlan';

@Index('program_content_permission_pkey', ['id'], { unique: true })
@Entity('program_content_plan', { schema: 'public' })
export class ProgramContentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProgramContent, (programContent) => programContent.programContentPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent;

  @ManyToOne(() => ProgramPlan, (programPlan) => programPlan.programContentPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_plan_id', referencedColumnName: 'id' }])
  programPlan: ProgramPlan;
}
