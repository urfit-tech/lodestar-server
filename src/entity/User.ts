import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserOauth } from './UserOauth';

@Index('user_pkey', ['id'], { unique: true })
@Index('user_refresh_token_key', ['refreshToken'], { unique: true })
@Entity('user', { schema: 'public' })
export class User {
  @Column('text', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column('text', { name: 'org_id' })
  orgId: string;

  @Column('text', { name: 'name', default: () => "'未命名使用者'" })
  name: string;

  @Column('text', { name: 'email' })
  email: string;

  @Column('text', { name: 'picture_url', nullable: true })
  pictureUrl: string | null;

  @Column('jsonb', { name: 'metadata', default: () => 'jsonb_build_object()' })
  metadata: object;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

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

  @Column('timestamp with time zone', { name: 'logined_at', nullable: true })
  loginedAt: Date | null;

  @Column('text', { name: 'username' })
  username: string;

  @Column('text', { name: 'passhash', nullable: true })
  passhash: string | null;

  @Column('text', { name: 'role' })
  role: string;

  @Column('uuid', {
    name: 'refresh_token',
    unique: true,
    default: () => 'gen_random_uuid()',
  })
  refreshToken: string;

  @Column('text', { name: 'phone', nullable: true })
  phone: string | null;

  @OneToMany(() => UserOauth, (userOauth) => userOauth.user)
  userOauths: UserOauth[];
}
