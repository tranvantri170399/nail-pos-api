import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentService } from '../appointment-services/appointment-service.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
    @InjectRepository(AppointmentService)
    private appointmentServiceRepo: Repository<AppointmentService>,
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

  async create(data: Partial<Appointment>) {
    const apt = this.repo.create(data);
    const savedAppointment = await this.repo.save(apt);
    
    // If appointmentServices are provided, create them
    if (data.appointmentServices && Array.isArray(data.appointmentServices)) {
      for (const serviceData of data.appointmentServices) {
        await this.appointmentServiceRepo.save({
          appointmentId: savedAppointment.id,
          serviceId: serviceData.serviceId,
          price: serviceData.price,
          durationMinutes: serviceData.durationMinutes,
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
}