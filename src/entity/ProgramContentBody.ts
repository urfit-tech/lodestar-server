import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

@Index('program_content_body_pkey', ['id'], { unique: true })
@Entity('program_content_body', { schema: 'public' })
export class ProgramContentBody {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'type', nullable: true })
  type: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('jsonb', { name: 'data', nullable: true })
  data: object | null;

  @Column('uuid', { name: 'target', nullable: true })
  target: string | null;

  @OneToMany(() => ProgramContent, (programContent) => programContent.contentBody)
  programContents: ProgramContent[];
}
