import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['staff', 'customer'] });
  }

  findByDate(date: string) {
    return this.repo.find({
      where: { scheduled_date: date },
      relations: ['staff', 'customer'],
      order: { start_time: 'ASC' },
    });
  }

  create(data: Partial<Appointment>) {
    const apt = this.repo.create(data);
    return this.repo.save(apt);
  }

  async updateStatus(id: number, status: string) {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number) {
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }
}