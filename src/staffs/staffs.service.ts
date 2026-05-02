// staffs/staffs.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class StaffsService {
  private readonly logger = new Logger(StaffsService.name);

  constructor(
    @InjectRepository(Staff)
    private staffsRepository: Repository<Staff>,
  ) {}

  async findBySalon(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Staff>> {
    try {
      this.logger.log(`findBySalon - salonId: ${salonId}, pagination: ${JSON.stringify(pagination)}`);

      const result = await paginateRepository(this.staffsRepository, pagination, {
        where: { salonId, isActive: true },
        order: { name: 'ASC' },
      });

      this.logger.log(`findBySalon result - total: ${result.meta.total}, data count: ${result.data.length}`);

      return result;
    } catch (error) {
      this.logger.error('Error in findBySalon:', error);
      throw error;
    }
  }

  create(data: Partial<Staff>) {
    try {
      const staff = this.staffsRepository.create({
        ...data,
        salonId: (data as any).salonId ?? (data as any).salon_id,
      });
      return this.staffsRepository.save(staff);
    } catch (error) {
      this.logger.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<Staff>, salonId?: number) {
    try {
      const staff = await this.staffsRepository.findOne({ where: { id } });
      if (!staff) throw new NotFoundException(`Staff #${id} not found`);
      if (salonId && staff.salonId !== salonId) {
        throw new ForbiddenException('Staff does not belong to your salon');
      }
      await this.staffsRepository.update(id, {
        ...data,
        salonId: (data as any).salonId ?? (data as any).salon_id ?? staff.salonId,
      });
      return this.staffsRepository.findOne({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error in update:', error);
      throw error;
    }
  }

  async remove(id: number, salonId?: number) {
    try {
      const staff = await this.staffsRepository.findOne({ where: { id } });
      if (!staff) throw new NotFoundException(`Staff #${id} not found`);
      if (salonId && staff.salonId !== salonId) {
        throw new ForbiddenException('Staff does not belong to your salon');
      }
      await this.staffsRepository.delete(id);
      return { message: 'Deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error in remove:', error);
      throw error;
    }
  }
}