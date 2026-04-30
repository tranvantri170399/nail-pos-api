// src/time-clocks/time-clock.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('time_clocks')
export class TimeClock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  salon_id: number;

  @Column()
  staff_id: number;

  @Column({ type: 'timestamp' })
  clock_in: Date;

  @Column({ type: 'timestamp', nullable: true })
  clock_out: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hours_worked: number;

  @Column({ default: 'active' })
  status: 'active' | 'completed';

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
