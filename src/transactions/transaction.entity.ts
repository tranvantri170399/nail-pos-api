// transactions/transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { TransactionItem } from './transaction-item.entity';
import { TransactionPayment } from './transaction-payment.entity';

@Entity('transactions')
@Index(['salonId'])
@Index(['appointmentId'])
@Index(['shiftId'])
@Index(['customerId'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column({ name: 'shift_id', nullable: true })
  shiftId: number;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  // ── Discount ──────────────────────────────────
  @Column({ name: 'discount_type', nullable: true })
  discountType: string; // 'percentage' | 'fixed' | null

  @Column({ name: 'discount_value', type: 'numeric', precision: 15, scale: 2, default: 0 })
  discountValue: number; // raw value: 10 = 10% or 50000

  @Column({ name: 'discount_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
  discountAmount: number; // computed amount

  @Column({ name: 'discount_reason', nullable: true })
  discountReason: string;

  // ── Tax ───────────────────────────────────────
  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxRate: number; // snapshot of salon's tax rate at time of transaction

  @Column({ name: 'tax_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  // ── Tip ───────────────────────────────────────
  @Column({ name: 'tip_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
  tipAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  // ── Payment ───────────────────────────────────
  @Column({ name: 'payment_method', default: 'cash' })
  paymentMethod: string; // primary method or 'split'

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  note: string;

  @Column({ name: 'paid_at', nullable: true, type: 'timestamptz' })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => TransactionItem, item => item.transaction, { cascade: true })
  items: TransactionItem[];

  @OneToMany(() => TransactionPayment, payment => payment.transaction, { cascade: true })
  payments: TransactionPayment[];
}