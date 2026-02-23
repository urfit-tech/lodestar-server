import { Column, CreateDateColumn, Entity, ObjectId, PrimaryGeneratedColumn } from 'typeorm';

@Entity('table_log')
export class TableLog {
  @PrimaryGeneratedColumn('uuid')
  id: ObjectId;

  @Column({ type: 'text', name: 'member_id' })
  memberId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'text',
    name: 'table_name',
  })
  tableName: string;

  @Column({ type: 'jsonb', nullable: true })
  new: any | null;

  @Column({ type: 'jsonb', nullable: true })
  old: any | null;
}
