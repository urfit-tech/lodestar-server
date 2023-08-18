import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MemberContract } from './MemberContract';

@Index('contract_pkey', ['id'], { unique: true })
@Entity('contract', { schema: 'public' })
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'description' })
  description: string;

  @Column('text', { name: 'deliverables', nullable: true })
  deliverables: string | null;

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

  @Column('text', { name: 'template', default: () => "'<div></div>'" })
  template: string;

  @Column('text', { name: 'revocation', nullable: true })
  revocation: string | null;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('text', { name: 'app_id' })
  appId: string;

  @OneToMany(() => MemberContract, (memberContract) => memberContract.contract)
  memberContracts: MemberContract[];
}
