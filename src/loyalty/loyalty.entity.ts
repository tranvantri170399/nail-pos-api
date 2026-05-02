// loyalty/loyalty.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Salon } from '../salons/salon.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: number; // Link to the original transaction

  @Column()
  type: string; // 'earned', 'redeemed', 'expired', 'adjusted'

  @Column({ type: 'numeric' })
  points: number; // Positive for earned, negative for redeemed

  @Column({ type: 'numeric', default: 0 })
  balance: number; // Points balance after this transaction

  @Column({ nullable: true })
  reason: string; // Description of why points were earned/redeemed

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Salon)
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;
}
