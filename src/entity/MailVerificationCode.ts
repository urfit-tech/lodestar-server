import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('mail_verification_code_pkey', ['id'], { unique: true })
@Entity('mail_verification_code', { schema: 'public' })
export class MailVerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'code' })
  code: string;

  @Column('text', { name: 'app_id' })
  appId: string;

  @Column('text', { name: 'email' })
  email: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'expired_at',
  })
  expiredAt: Date;
}
