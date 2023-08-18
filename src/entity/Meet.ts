import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('meet_pkey', ['id'], { unique: true })
@Entity('meet', { schema: 'public' })
export class Meet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('timestamp with time zone', { name: 'started_at' })
  startedAt: Date;

  @Column('timestamp with time zone', { name: 'ended_at' })
  endedAt: Date;

  @Column('timestamp with time zone', { name: 'nbf_at', nullable: true })
  nbfAt: Date | null;

  @Column('timestamp with time zone', { name: 'exp_at', nullable: true })
  expAt: Date | null;

  @Column('boolean', { name: 'auto_recording' })
  autoRecording: boolean;

  @Column('jsonb', { name: 'options' })
  options: object;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;
}
