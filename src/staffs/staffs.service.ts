// staffs/staffs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(data: Partial<Staff>) {
    const staff = this.staffsRepository.create({
      ...data,
      salonId: (data as any).salonId ?? (data as any).salon_id,
    });
    return this.staffsRepository.save(staff);
  }

  async update(id: number, data: Partial<Staff>) {
    await this.staffsRepository.update(id, {
      ...data,
      salonId: (data as any).salonId ?? (data as any).salon_id,
    });
    const staff = await this.staffsRepository.findOne({ where: { id } });
    if (!staff) throw new NotFoundException(`Staff #${id} not found`);
    return staff;
  }

  async remove(id: number) {
    const staff = await this.staffsRepository.findOne({ where: { id } });
    if (!staff) throw new NotFoundException(`Staff #${id} not found`);
    await this.staffsRepository.delete(id);
    return { message: 'Deleted successfully' };
  }
}