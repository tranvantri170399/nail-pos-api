// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../staffs/staff.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
  ) {}

  @Get()
  async check() {
    // Query DB để giữ Supabase active
    const staffCount = await this.staffRepo.count();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
      staffCount,
    };
  }
}
