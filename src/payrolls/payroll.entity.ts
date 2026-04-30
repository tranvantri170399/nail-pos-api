// src/payrolls/payroll.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payrolls')
export class Payroll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  salon_id: number;

  @Column()
  staff_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commission_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tip_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'date' })
  period_start: Date;

  @Column({ type: 'date' })
  period_end: Date;

  @Column({ default: 'pending' })
  status: 'pending' | 'paid' | 'cancelled';

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
