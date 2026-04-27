// transactions/transaction-payment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('transaction_payments')
export class TransactionPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'payment_method' })
  paymentMethod: string; // 'cash' | 'card' | 'transfer' | 'gift_card' | 'other'

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  reference: string; // card last 4, transfer ID, etc.

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Transaction, transaction => transaction.payments)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
