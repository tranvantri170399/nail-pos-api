import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentService } from '../appointment-services/appointment-service.entity';
import { Staff } from '../staffs/staff.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
    @InjectRepository(AppointmentService)
    private appointmentServiceRepo: Repository<AppointmentService>,
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
  ) {}

  findAll() {
    return this.repo.find({ 
      relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service'] 
    });
  }

  findByDate(date: string) {
    return this.repo.find({
      where: { scheduled_date: date },
      relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service'],
      order: { start_time: 'ASC' },
    });
  }

  async create(data: CreateAppointmentDto) {
    if (!data.staff_id) {
      throw new BadRequestException('staff_id is required');
    }
    if (!data.start_time || !data.end_time || !data.scheduled_date) {
      throw new BadRequestException('scheduled_date, start_time and end_time are required');
    }

    const staff = await this.staffRepo.findOne({ where: { id: data.staff_id } });
    if (!staff) {
      throw new NotFoundException(`Staff #${data.staff_id} not found`);
    }

    const salonId = staff.salonId;
    const appointmentStart = this.timeToMinutes(data.start_time);
    const appointmentEnd = this.timeToMinutes(data.end_time);

    if (appointmentEnd <= appointmentStart) {
      throw new BadRequestException('end_time must be after start_time');
    }

    const conflict = await this.repo
      .createQueryBuilder('appointment')
      .where('appointment.staff_id = :staffId', { staffId: data.staff_id })
      .andWhere('appointment.scheduled_date = :scheduledDate', {
        scheduledDate: data.scheduled_date,
      })
      .andWhere('appointment.status NOT IN (:...blockedStatuses)', {
        blockedStatuses: ['cancelled', 'no_show'],
      })
      .andWhere('NOT (appointment.end_time <= :startTime OR appointment.start_time >= :endTime)', {
        startTime: data.start_time,
        endTime: data.end_time,
      })
      .getOne();

    if (conflict) {
      throw new BadRequestException('Staff already has an overlapping appointment');
    }

    const appointmentPayload: Partial<Appointment> = {
      customer_id: data.customer_id,
      staff_id: data.staff_id,
      salon_id: salonId,
      scheduled_date: data.scheduled_date,
      start_time: data.start_time,
      end_time: data.end_time,
      total_minutes: data.total_minutes,
      total_price: data.total_price,
      status: data.status,
      note: data.note,
      source: data.source,
    };

    if (data.salon_id !== undefined) {
      appointmentPayload.salon_id = data.salon_id;
    }

    const appointmentServices = data.appointment_services;

    const apt = this.repo.create(appointmentPayload);

    const savedAppointment = await this.repo.save(apt as Appointment);
    
    // If appointmentServices are provided, create them
    if (appointmentServices && Array.isArray(appointmentServices)) {
      for (const serviceData of appointmentServices) {
        await this.appointmentServiceRepo.save({
          appointmentId: savedAppointment.id,
          serviceId: serviceData.service_id,
          price: serviceData.price,
          durationMinutes: serviceData.duration_minutes,
        });
      }
      
      // Recalculate totals
      await this.recalculateTotals(savedAppointment.id);
    }
    
    return this.repo.findOne({ 
      where: { id: savedAppointment.id },
      relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service']
    });
  }

  async updateStatus(id: number, status: string) {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number) {
    // Delete related appointment services first
    await this.appointmentServiceRepo.delete({ appointmentId: id });
    
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }

  private async recalculateTotals(appointmentId: number) {
    const services = await this.appointmentServiceRepo.find({
      where: { appointmentId },
    });
    
    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
    const totalMinutes = services.reduce((sum, service) => sum + service.durationMinutes, 0);
    
    await this.repo.update(appointmentId, {
      total_price: totalPrice,
      total_minutes: totalMinutes,
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
  }
}