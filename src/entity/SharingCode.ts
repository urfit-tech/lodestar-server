import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

@Index('sharing_code_pkey', ['id'], { unique: true })
@Entity('sharing_code', { schema: 'public' })
export class SharingCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'path' })
  path: string;

  @Column('text', { name: 'code' })
  code: string;

  @Column('text', { name: 'note', nullable: true })
  note: string | null;

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

  @ManyToOne(() => App, (app) => app.sharingCodes, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;
}
