import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentService } from './appointment-service.entity';

@Injectable()
export class AppointmentServicesService {
  constructor(
    @InjectRepository(AppointmentService)
    private repo: Repository<AppointmentService>,
  ) {}

  async findByAppointment(appointmentId: number) {
    return this.repo.find({
      where: { appointmentId },
      relations: ['service'],
    });
  }

  async addToAppointment(appointmentId: number, serviceId: number, price: number, durationMinutes: number) {
    const appointmentService = this.repo.create({
      appointmentId,
      serviceId,
      price,
      durationMinutes,
    });
    return this.repo.save(appointmentService);
  }

  async updateAppointmentService(id: number, price: number, durationMinutes: number) {
    await this.repo.update(id, { price, durationMinutes });
    return this.repo.findOne({ where: { id } });
  }

  async removeFromAppointment(id: number) {
    await this.repo.delete(id);
    return { message: 'Service removed from appointment successfully' };
  }

  async calculateAppointmentTotals(appointmentId: number) {
    const services = await this.findByAppointment(appointmentId);
    
    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
    const totalMinutes = services.reduce((sum, service) => sum + service.durationMinutes, 0);

    return {
      totalPrice,
      totalMinutes,
      serviceCount: services.length,
    };
  }
}
