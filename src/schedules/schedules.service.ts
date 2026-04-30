// src/schedules/schedules.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private repo: Repository<Schedule>,
  ) {}

  async create(salonId: number, body: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.repo.create({
      salon_id: salonId,
      staff_id: body.staff_id,
      schedule_date: new Date(body.schedule_date),
      start_time: body.start_time,
      end_time: body.end_time,
      status: 'active',
      notes: body.notes,
    });
    return this.repo.save(schedule);
  }

  async findBySalon(salonId: number, status?: string, date?: string): Promise<Schedule[]> {
    const where: any = { salon_id: salonId };
    if (status) {
      where.status = status;
    }
    if (date) {
      where.schedule_date = new Date(date);
    }
    return this.repo.find({
      where,
      order: { schedule_date: 'ASC', start_time: 'ASC' },
    });
  }

  async findByStaff(salonId: number, staffId: number): Promise<Schedule[]> {
    return this.repo.find({
      where: { salon_id: salonId, staff_id: staffId },
      order: { schedule_date: 'ASC', start_time: 'ASC' },
    });
  }

  async findOne(id: number, salonId: number): Promise<Schedule> {
    const schedule = await this.repo.findOne({
      where: { id },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.salon_id !== salonId) {
      throw new ForbiddenException('Schedule does not belong to your salon');
    }
    return schedule;
  }

  async update(id: number, salonId: number, body: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id, salonId);
    Object.assign(schedule, body);
    return this.repo.save(schedule);
  }

  async remove(id: number, salonId: number): Promise<void> {
    const schedule = await this.findOne(id, salonId);
    await this.repo.remove(schedule);
  }
}
