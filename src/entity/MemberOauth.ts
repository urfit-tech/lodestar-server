import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('member_oauth_pkey', ['id'], { unique: true })
@Index('member_oauth_member_id_provider_key', ['memberId', 'provider'], {
  unique: true,
})
@Entity('member_oauth', { schema: 'public' })
export class MemberOauth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('text', { name: 'provider', unique: true })
  provider: string;

  @Column('text', { name: 'provider_user_id' })
  providerUserId: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @ManyToOne(() => Member, (member) => member.memberOauths, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
