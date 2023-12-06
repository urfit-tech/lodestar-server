import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contract } from './Contract';
import { Member } from '~/member/entity/member.entity';

@Index('member_contract_agreed_at', ['agreedAt'], {})
@Index('member_contract_agreed_at_revoked_at_idx', ['agreedAt', 'revokedAt'], {})
@Index('member_contract_pkey', ['id'], { unique: true })
@Index('member_contract_revoked_at', ['revokedAt'], {})
@Entity('member_contract', { schema: 'public' })
export class MemberContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('jsonb', { name: 'values', nullable: true })
  values: object | null;

  @Column('timestamp with time zone', { name: 'agreed_at', nullable: true })
  agreedAt: Date | null;

  @Column('text', { name: 'agreed_ip', nullable: true })
  agreedIp: string | null;

  @Column('jsonb', { name: 'agreed_options', nullable: true })
  agreedOptions: object | null;

  @Column('timestamp with time zone', { name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @Column('jsonb', { name: 'revocation_values', nullable: true })
  revocationValues: object | null;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.memberContracts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'author_id', referencedColumnName: 'id' }])
  author: Member;

  @ManyToOne(() => Contract, (contract) => contract.memberContracts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'contract_id', referencedColumnName: 'id' }])
  contract: Contract;

  @ManyToOne(() => Member, (member) => member.memberContracts2, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
