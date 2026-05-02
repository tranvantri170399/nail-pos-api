// notifications/notification.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';
import { Salon } from '../salons/salon.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salon_id' })
  salonId: number;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: number;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @Column()
  type: string; // 'appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'promotion'

  @Column()
  channel: string; // 'sms', 'zalo', 'email', 'in_app'

  @Column({ nullable: true })
  title: string;

  @Column('text')
  message: string;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'sent', 'failed'

  @Column({ nullable: true })
  error: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Salon)
  @JoinColumn({ name: 'salon_id' })
  salon: Salon;
}
