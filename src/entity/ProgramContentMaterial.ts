import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

@Index('program_content_material_pkey', ['id'], { unique: true })
@Entity('program_content_material', { schema: 'public' })
export class ProgramContentMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { name: 'data', nullable: true })
  data: object | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @ManyToOne(() => ProgramContent, (programContent) => programContent.programContentMaterials, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent;
}
