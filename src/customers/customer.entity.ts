import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id', nullable: true })
  salon_id: number;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: 0 })
  total_visits: number;

  @Column({ default: 0 })
  total_spent: number;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'loyalty_tier', nullable: true })
  loyaltyTier: string; // 'bronze', 'silver', 'gold', 'platinum'

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}