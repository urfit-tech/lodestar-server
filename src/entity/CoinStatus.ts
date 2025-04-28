import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Member } from '~/member/entity/member.entity';
import { CoinLog } from './CoinLog';

@Entity('coin_status', { schema: 'public' })
export class CoinStatus {
  @Column('uuid', { name: 'coin_id' })
  coinId: string;

  @OneToOne(() => CoinLog, (coinLog) => coinLog.id, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'coin_id', referencedColumnName: 'id' })
  coinLog: CoinLog;

  @Column('uuid', { name: 'member_id' })
  memberId: string;

  @OneToOne(() => Member, (member) => member.coinLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'member_id', referencedColumnName: 'id' })
  member: Member;

  @Column('numeric')
  amount: number;

  @Column('numeric', { name: 'used_coins' })
  usedCoins: number;

  @Column('numeric', { name: 'remaining' })
  remaining: number;
}
