// transactions/transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { TransactionItem } from './transaction-item.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'appointment_id' })
  appointmentId: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column({ type: 'numeric', default: 0 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'numeric', default: 0 })
  discountAmount: number;

  @Column({ name: 'tip_amount', type: 'numeric', default: 0 })
  tipAmount: number;

  @Column({ name: 'tax_amount', type: 'numeric', default: 0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', default: 0 })
  totalAmount: number;

  @Column({ name: 'payment_method', default: 'cash' })
  paymentMethod: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  note: string;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => TransactionItem, item => item.transaction, { cascade: true })
  items: TransactionItem[];
}