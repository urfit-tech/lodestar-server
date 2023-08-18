import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('member_card_member_id_card_identifier_key', ['cardIdentifier', 'memberId'], { unique: true })
@Index('member_card_id_key', ['id'], { unique: true })
@Index('member_card_pkey', ['id'], { unique: true })
@Entity('member_card', { schema: 'public' })
export class MemberCard {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('jsonb', { name: 'card_info' })
  cardInfo: object;

  @Column('jsonb', { name: 'card_secret' })
  cardSecret: object;

  @Column('text', { name: 'card_identifier', unique: true })
  cardIdentifier: string;

  @Column('jsonb', { name: 'card_holder', nullable: true })
  cardHolder: object | null;

  @Column('integer', { name: 'priority', default: () => 0 })
  priority: number;

  @ManyToOne(() => Member, (member) => member.memberCards, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
