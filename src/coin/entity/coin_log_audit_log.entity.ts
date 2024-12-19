import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Member } from '../../member/entity/member.entity';

@Entity()
export class CoinLogAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'text' })
  memberId: string;

  @Column({ type: 'text' })
  action: 'upload';

  @Column({ type: 'text' })
  target: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Member, (m) => m.id)
  @JoinColumn({ name: 'member_id' })
  member: Member;
}
