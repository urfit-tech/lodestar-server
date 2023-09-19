import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AuthAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'text' })
  memberId: string;

  @Column({ type: 'text' })
  action: 'apply_temporary_password';

  @Column({ type: 'text' })
  target: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('jsonb', { name: 'metadata', default: () => 'jsonb_build_object()' })
  metadata: object;
}
