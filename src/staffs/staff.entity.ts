// staffs/staff.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('staffs')
@Index(['salonId'])
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id', nullable: false })
  salonId: number;  // ← required field

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'pin_code', nullable: true })
  pinCode: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: 'junior' })
  role: string;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 2, default: 0 })
  commissionRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}