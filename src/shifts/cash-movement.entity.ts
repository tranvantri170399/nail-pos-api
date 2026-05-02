// shifts/cash-movement.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Shift } from './shift.entity';

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'shift_id' })
  shiftId: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column({ name: 'staff_id' })
  staffId: number;

  @Column()
  type: string; // 'cash_in' | 'cash_out' | 'safe_drop'

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Shift, shift => shift.cashMovements)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;
}
