// services/services.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private repo: Repository<Service>,
  ) {}

  // Lấy tất cả services theo salon, kèm category
  async findBySalon(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Service>> {
    try {
      return paginateRepository(this.repo, pagination, {
        where: { salonId, isActive: true },
        relations: ['category'],
        order: { categoryId: 'ASC', name: 'ASC' },
      });
    } catch (error) {
      this.logger.error('Error in findBySalon:', error);
      throw error;
    }
  }

  // Lấy services theo category
  async findByCategory(categoryId: number): Promise<Service[]> {
    try {
      return this.repo.find({
        where: { categoryId, isActive: true },
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error('Error in findByCategory:', error);
      throw error;
    }
  }

  async findOne(id: number, salonId?: number): Promise<Service> {
    try {
      const item = await this.repo.findOne({
        where: { id },
        relations: ['category'],
      });
      if (!item) throw new NotFoundException(`Service #${id} not found`);
      if (salonId && item.salonId !== salonId) {
        throw new ForbiddenException('Service does not belong to your salon');
      }
      return item;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async create(body: Partial<Service>): Promise<Service> {
    try {
      return this.repo.save(this.repo.create(body));
    } catch (error) {
      this.logger.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: number, body: Partial<Service>, salonId?: number): Promise<Service> {
    try {
      const item = await this.repo.findOne({ where: { id } });
      if (!item) throw new NotFoundException(`Service #${id} not found`);
      if (salonId && item.salonId !== salonId) {
        throw new ForbiddenException('Service does not belong to your salon');
      }
      await this.repo.update(id, body);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error in update:', error);
      throw error;
    }
  }

  async remove(id: number, salonId?: number): Promise<void> {
    try {
      const item = await this.repo.findOne({ where: { id } });
      if (!item) throw new NotFoundException(`Service #${id} not found`);
      if (salonId && item.salonId !== salonId) {
        throw new ForbiddenException('Service does not belong to your salon');
      }
      await this.repo.update(id, { isActive: false });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error in remove:', error);
      throw error;
    }
  }
}