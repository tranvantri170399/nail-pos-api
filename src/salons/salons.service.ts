// salons/salons.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findOneWithAccess(id: number, user: any): Promise<Salon> {
    const salon = await this.findOne(id);
    if (user.type === 'owner' && salon.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this salon');
    }
    if (user.type === 'staff' && user.salonId !== id) {
      throw new ForbiddenException('You do not have access to this salon');
    }
    return salon;
  }

  async create(body: Partial<Salon>): Promise<Salon> {
    return this.repo.save(this.repo.create(body));
  }

  async update(id: number, body: Partial<Salon>): Promise<Salon> {
    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async updateWithAccess(id: number, body: Partial<Salon>, user: any): Promise<Salon> {
    const salon = await this.findOne(id);
    if (user.type === 'owner' && salon.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this salon');
    }
    if (user.type === 'staff') {
      throw new ForbiddenException('Staff cannot update salon settings');
    }
    await this.repo.update(id, body);
    return this.findOne(id);
  }
}