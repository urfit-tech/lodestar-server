import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('iszn_user_pkey', ['id'], { unique: true })
@Entity('iszn_user', { schema: 'public' })
export class IsznUser {
  @PrimaryColumn()
  id: string

  @Column('text', { name: 'name', nullable: true })
  name: string | null

  @Column('text', { name: 'email' })
  email: string

  @Column('text', { name: 'picture', nullable: true })
  picture: string | null

  @Column('text', { name: 'profile', nullable: true })
  profile: string | null

  @Column('boolean', { name: 'email_verified', nullable: true })
  emailVerified: boolean | null

  @Column('timestamp with time zone', { name: 'loginedat', nullable: true })
  loginedat: Date | null

  @Column('timestamp with time zone', { name: 'createdat', nullable: true })
  createdat: Date | null

  @Column('text', { name: 'address', nullable: true })
  address: string | null

  @Column('numeric', { name: 'age', nullable: true })
  age: number | null

  @Column('text', { name: 'status', nullable: true })
  status: string | null

  @Column('timestamp with time zone', { name: 'updatedat', nullable: true })
  updatedat: Date | null
}
