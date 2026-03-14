// salons/salon.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ServiceCategory } from '../service-categories/service-category.entity';

@Entity('salons')
export class Salon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'opening_time', default: '09:00' })
  openingTime: string;

  @Column({ name: 'closing_time', default: '20:00' })
  closingTime: string;

  @Column({ name: 'working_days', type: 'text', array: true, default: ['mon','tue','wed','thu','fri','sat'] })
  workingDays: string[];

  @Column({ default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ name: 'tax_rate', type: 'numeric', default: 0 })
  taxRate: number;

  @Column({ name: 'tip_enabled', default: true })
  tipEnabled: boolean;

  @Column({ name: 'default_tip', type: 'numeric', default: 0 })
  defaultTip: number;

  @Column({ name: 'slot_duration', default: 15 })
  slotDuration: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ServiceCategory, category => category.salon)
  categories: ServiceCategory[];
}