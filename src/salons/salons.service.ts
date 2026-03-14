// salons/salons.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salon } from './salon.entity';

@Injectable()
export class SalonsService {
  constructor(
    @InjectRepository(Salon)
    private repo: Repository<Salon>,
  ) {}

  async findByOwner(ownerId: number): Promise<Salon[]> {
    return this.repo.find({ where: { ownerId, isActive: true } });
  }

  async findOne(id: number): Promise<Salon> {
    const salon = await this.repo.findOne({ where: { id } });
    if (!salon) throw new NotFoundException(`Salon #${id} not found`);
    return salon;
  }

  async create(body: Partial<Salon>): Promise<Salon> {
    return this.repo.save(this.repo.create(body));
  }

  async update(id: number, body: Partial<Salon>): Promise<Salon> {
    await this.repo.update(id, body);
    return this.findOne(id);
  }
}