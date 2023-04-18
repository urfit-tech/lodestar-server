import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('table_log')
export class TableLog {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({
    type: 'timestamp with time zone',
    name: 'inserted_at',
    default: new Date(),
  })
  insertedAt: Date;

  @Column()
  operation: 'INSERT' | 'UPDATE' | 'DELETE';

  @Column({ type: 'json' })
  new: any;

  @Column({ type: 'json' })
  old: any;
}
