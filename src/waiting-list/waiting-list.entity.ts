// src/waiting-list/waiting-list.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('waiting_list')
export class WaitingList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  salon_id: number;

  @Column({ nullable: true })
  customer_id: number;

  @Column()
  customer_name: string;

  @Column()
  customer_phone: string;

  @Column({ nullable: true })
  staff_id: number;

  @Column({ default: 'waiting' })
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';

  @Column({ type: 'integer', default: 0 })
  party_size: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ type: 'timestamp', nullable: true })
  assigned_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
