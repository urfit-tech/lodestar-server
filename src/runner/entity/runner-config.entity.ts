import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum BackendProject {
  LodestarServer = 'lodestar_server',
  KolableServer = 'kolable_server',
  LodestarAppBackend = 'lodestar-app-backend',
}

@Entity('runner_config')
@Unique(['runnerName', 'backendProject'])
export class RunnerConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'runner_name' })
  runnerName: string;

  @Column({ type: 'int', name: 'batch_size', default: 20 })
  batchSize: number;

  @Column({ type: 'int', name: 'interval_ms', default: 300000 })
  intervalMs: number;

  @Column({
    type: 'enum',
    enum: BackendProject,
    name: 'backend_project',
    default: BackendProject.LodestarServer,
  })
  backendProject: BackendProject;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateBackendProject() {
    if (this.backendProject !== BackendProject.LodestarServer) {
      throw new Error('backendProject must be LodestarServer');
    }
  }
}
