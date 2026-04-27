// services/services.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private repo: Repository<Service>,
  ) {}

  // Lấy tất cả services theo salon, kèm category
  async findBySalon(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Service>> {
    return paginateRepository(this.repo, pagination, {
      where: { salonId, isActive: true },
      relations: ['category'],
      order: { categoryId: 'ASC', name: 'ASC' },
    });
  }

  // Lấy services theo category
  async findByCategory(categoryId: number): Promise<Service[]> {
    return this.repo.find({
      where: { categoryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number, salonId?: number): Promise<Service> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!item) throw new NotFoundException(`Service #${id} not found`);
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Service does not belong to your salon');
    }
    return item;
  }

  async create(body: Partial<Service>): Promise<Service> {
    return this.repo.save(this.repo.create(body));
  }

  async update(id: number, body: Partial<Service>, salonId?: number): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Service #${id} not found`);
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Service does not belong to your salon');
    }
    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async remove(id: number, salonId?: number): Promise<void> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Service #${id} not found`);
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Service does not belong to your salon');
    }
    await this.repo.update(id, { isActive: false });
  }
}