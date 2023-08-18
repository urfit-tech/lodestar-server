import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('project_reaction_pkey', ['id'], { unique: true })
@Entity('project_reaction', { schema: 'public' })
export class ProjectReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('uuid', { name: 'project_id' })
  projectId: string;
}
