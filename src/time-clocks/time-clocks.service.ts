// src/time-clocks/time-clocks.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeClock } from './time-clock.entity';
import { CreateTimeClockDto, UpdateTimeClockDto } from './dto/create-time-clock.dto';

@Injectable()
export class TimeClocksService {
  constructor(
    @InjectRepository(TimeClock)
    private repo: Repository<TimeClock>,
  ) {}

  async create(salonId: number, body: CreateTimeClockDto): Promise<TimeClock> {
    const timeClock = this.repo.create({
      salon_id: salonId,
      staff_id: body.staff_id,
      clock_in: body.clock_in,
      clock_out: body.clock_out,
      hours_worked: 0,
      status: 'active',
      notes: body.notes,
    });
    return this.repo.save(timeClock);
  }

  async findBySalon(salonId: number, status?: string): Promise<TimeClock[]> {
    const where: any = { salon_id: salonId };
    if (status) {
      where.status = status;
    }
    return this.repo.find({
      where,
      order: { clock_in: 'DESC' },
      relations: ['staff'],
    });
  }

  async findByStaff(salonId: number, staffId: number): Promise<TimeClock[]> {
    return this.repo.find({
      where: { salon_id: salonId, staff_id: staffId },
      order: { clock_in: 'DESC' },
      relations: ['staff'],
    });
  }

  async findActiveByStaff(salonId: number, staffId: number): Promise<TimeClock | null> {
    return this.repo.findOne({
      where: {
        salon_id: salonId,
        staff_id: staffId,
        status: 'active',
      },
      relations: ['staff'],
    });
  }

  async findOne(id: number, salonId: number): Promise<TimeClock> {
    const timeClock = await this.repo.findOne({
      where: { id },
      relations: ['staff'],
    });
    if (!timeClock) throw new NotFoundException('Time clock not found');
    if (timeClock.salon_id !== salonId) {
      throw new ForbiddenException('Time clock does not belong to your salon');
    }
    return timeClock;
  }

  async clockIn(salonId: number, staffId: number, notes?: string): Promise<TimeClock> {
    // Check if there's already an active clock-in
    const existing = await this.findActiveByStaff(salonId, staffId);
    if (existing) {
      throw new Error('Staff already clocked in');
    }

    const timeClock = this.repo.create({
      salon_id: salonId,
      staff_id: staffId,
      clock_in: new Date(),
      hours_worked: 0,
      status: 'active',
      notes,
    });
    return this.repo.save(timeClock);
  }

  async clockOut(id: number, salonId: number): Promise<TimeClock> {
    const timeClock = await this.findOne(id, salonId);
    
    if (timeClock.status !== 'active') {
      throw new Error('Time clock is not active');
    }

    timeClock.clock_out = new Date();
    timeClock.status = 'completed';
    
    // Calculate hours worked
    const diff = timeClock.clock_out.getTime() - timeClock.clock_in.getTime();
    timeClock.hours_worked = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
    
    return this.repo.save(timeClock);
  }

  async update(id: number, salonId: number, body: UpdateTimeClockDto): Promise<TimeClock> {
    const timeClock = await this.findOne(id, salonId);
    Object.assign(timeClock, body);
    return this.repo.save(timeClock);
  }

  async remove(id: number, salonId: number): Promise<void> {
    const timeClock = await this.findOne(id, salonId);
    await this.repo.remove(timeClock);
  }
}
