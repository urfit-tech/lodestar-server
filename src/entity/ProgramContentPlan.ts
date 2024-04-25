import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { ProgramPlan } from './ProgramPlan';

@Index('program_content_permission_pkey', ['id'], { unique: true })
@Entity('program_content_plan', { schema: 'public' })
export class ProgramContentPlan {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'program_plan_id' })
  programPlanId: string;

  @Column('uuid', { name: 'program_content_id' })
  programContentId: string;

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
