import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';

@Index('user_oauth_pkey', ['id'], { unique: true })
@Index('user_oauth_user_id_provider_key', ['provider', 'userId'], {
  unique: true,
})
@Entity('user_oauth', { schema: 'public' })
export class UserOauth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'user_id', unique: true })
  userId: string;

  @Column('text', { name: 'provider', unique: true })
  provider: string;

  @Column('text', { name: 'provider_user_id' })
  providerUserId: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @ManyToOne(() => User, (user) => user.userOauths, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User;
}
