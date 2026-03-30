import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Service } from '../services/service.entity';

@Entity('appointment_services')
export class AppointmentService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'appointment_id' })
  appointmentId: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @Column({ type: 'numeric' })
  price: number;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @ManyToOne(() => Appointment, appointment => appointment.appointmentServices)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
