// services/services.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private repo: Repository<Service>,
  ) {}

  // Lấy tất cả services theo salon, kèm category
  async findBySalon(salonId: number): Promise<Service[]> {
    return this.repo.find({
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

  async findOne(id: number): Promise<Service> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!item) throw new NotFoundException(`Service #${id} not found`);
    return item;
  }

  async create(body: Partial<Service>): Promise<Service> {
    return this.repo.save(this.repo.create(body));
  }

  async update(id: number, body: Partial<Service>): Promise<Service> {
    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }
}