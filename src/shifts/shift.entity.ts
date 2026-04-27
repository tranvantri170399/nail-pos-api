// shifts/shift.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { CashMovement } from './cash-movement.entity';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column({ name: 'opened_by' })
  openedBy: number; // staff_id

  @Column({ name: 'closed_by', nullable: true })
  closedBy: number; // staff_id

  @Column({ name: 'starting_cash', type: 'numeric', default: 0 })
  startingCash: number;

  @Column({ name: 'ending_cash', type: 'numeric', nullable: true })
  endingCash: number;

  @Column({ name: 'expected_cash', type: 'numeric', default: 0 })
  expectedCash: number;

  @Column({ name: 'total_cash_sales', type: 'numeric', default: 0 })
  totalCashSales: number;

  @Column({ name: 'total_card_sales', type: 'numeric', default: 0 })
  totalCardSales: number;

  @Column({ name: 'total_other_sales', type: 'numeric', default: 0 })
  totalOtherSales: number;

  @Column({ name: 'total_tips', type: 'numeric', default: 0 })
  totalTips: number;

  @Column({ name: 'total_refunds', type: 'numeric', default: 0 })
  totalRefunds: number;

  @Column({ name: 'cash_in_total', type: 'numeric', default: 0 })
  cashInTotal: number;

  @Column({ name: 'cash_out_total', type: 'numeric', default: 0 })
  cashOutTotal: number;

  @Column({ name: 'cash_difference', type: 'numeric', nullable: true })
  cashDifference: number;

  @Column({ default: 'open' })
  status: string; // 'open' | 'closed'

  @Column({ name: 'close_note', nullable: true })
  closeNote: string;

  @Column({ name: 'transaction_count', default: 0 })
  transactionCount: number;

  @CreateDateColumn({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date;

  @OneToMany(() => CashMovement, movement => movement.shift)
  cashMovements: CashMovement[];
}
