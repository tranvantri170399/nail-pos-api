// transactions/transaction-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('transaction_items')
export class TransactionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'service_id', nullable: true })
  serviceId: number;

  @Column({ name: 'staff_id', nullable: true })
  staffId: number;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column({ type: 'numeric', default: 0 })
  price: number;

  @Column({ name: 'commission_rate', type: 'numeric', default: 0 })
  commissionRate: number;

  @Column({ name: 'commission_amount', type: 'numeric', default: 0 })
  commissionAmount: number;

  @ManyToOne(() => Transaction, transaction => transaction.items)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}