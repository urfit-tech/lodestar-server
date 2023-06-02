import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { TableLog } from '~/table_log/table_log.entity';

@Entity()
export class TriggerLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => TableLog)
  @JoinColumn({ name: 'table_log_id', referencedColumnName: 'id', })
  tableLog: TableLog;

  @Column({ type: 'jsonb' })
  result: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
