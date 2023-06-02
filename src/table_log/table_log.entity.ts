import { Column, CreateDateColumn, Entity, ObjectId, PrimaryGeneratedColumn } from 'typeorm';

@Entity('table_log')
export class TableLog {
  @PrimaryGeneratedColumn('uuid')
  id: ObjectId;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'text',
    name: 'table_name',
  })
  tableName: string;

  @Column({ type: 'json', nullable: true })
  new: any | null;

  @Column({ type: 'json', nullable: true })
  old: any | null;
}
