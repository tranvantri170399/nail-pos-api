// service-categories/service-categories.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './service-category.entity';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private repo: Repository<ServiceCategory>,
  ) {}

  async findBySalon(salonId: number): Promise<ServiceCategory[]> {
    return this.repo.find({
      where: { salonId, isActive: true },
      relations: ['services'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number, salonId?: number): Promise<ServiceCategory> {
    const item = await this.repo.findOne({ where: { id }, relations: ['services'] });
    if (!item) throw new NotFoundException(`Category #${id} not found`);
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Category does not belong to your salon');
    }
    return item;
  }

  async create(body: Partial<ServiceCategory>): Promise<ServiceCategory> {
    return this.repo.save(this.repo.create(body));
  }

  async update(id: number, body: Partial<ServiceCategory>, salonId?: number): Promise<ServiceCategory> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Category #${id} not found`);
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Category does not belong to your salon');
    }
    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async remove(id: number, salonId?: number): Promise<void> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Category #${id} not found`);
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Category does not belong to your salon');
    }
    await this.repo.update(id, { isActive: false });
  }
}