// staffs/staff.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('staffs')
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id', nullable: true })
  salonId: number;  // ← phải có field này

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

  @Column({ name: 'commission_rate', type: 'numeric', default: 0 })
  commissionRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}