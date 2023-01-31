import {
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
} from 'typeorm';

import { Program } from './program';

@Entity()
export class ProgramContentSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Program, (p) => p.id)
  @JoinColumn({ name: 'program_id' })
  programId!: Program;

  @Column({ type: 'text', nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int4', nullable: false })
  position!: number;
}
