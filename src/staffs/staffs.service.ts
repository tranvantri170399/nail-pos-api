// staffs/staffs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';

@Injectable()
export class StaffsService {
  constructor(
    @InjectRepository(Staff)
    private staffsRepository: Repository<Staff>,
  ) {}

  findAll() {
    return this.staffsRepository.find();
  }

  findBySalon(salonId: number) {  // ← thêm method này
    return this.staffsRepository.find({
      where: { salonId, isActive: true },
      order: { name: 'ASC' },
    });
  }
}