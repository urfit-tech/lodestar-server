import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Venue } from './Venue';

@Index('venue_seat_pkey', ['id'], { unique: true })
@Entity('venue_seat', { schema: 'public' })
export class VenueSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer', { name: 'position' })
  position: number;

  @Column('boolean', { name: 'disabled', default: () => false })
  disabled: boolean;

  @Column('text', { name: 'category', nullable: true })
  category: string | null;

  @ManyToOne(() => Venue, (venue) => venue.venueSeats, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'venue_id', referencedColumnName: 'id' }])
  venue: Venue;
}
