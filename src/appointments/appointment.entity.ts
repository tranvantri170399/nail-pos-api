import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Staff } from '../staffs/staff.entity';
import { Customer } from '../customers/customer.entity';
import { AppointmentService } from '../appointment-services/appointment-service.entity';

@Entity('appointments')
@Index(['salon_id'])
@Index(['customer_id'])
@Index(['staff_id'])
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ nullable: true })
  staff_id: number;

  @Column({ name: 'salon_id', nullable: true })
  salon_id: number;

  @Column({ type: 'date', nullable: true })
  scheduled_date: Date;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column()
  total_minutes: number;

  @Column({ default: 0 })
  buffer_minutes: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  total_price: number;

  @Column({ default: 'scheduled' })
  status: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: 'walk_in' })
  source: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => AppointmentService, appointmentService => appointmentService.appointment)
  appointmentServices: AppointmentService[];
}