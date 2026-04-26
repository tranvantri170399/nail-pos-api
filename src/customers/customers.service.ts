import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findBySalon(salonId: number) {
    return this.repo.find({
      where: { salon_id: salonId },
      order: { name: 'ASC' },
    });
  }

  findByPhone(phone: string) {
    return this.repo.findOne({ where: { phone } });
  }

  create(data: Partial<Customer>) {
    const customer = this.repo.create({
      ...data,
      salon_id: (data as any).salonId ?? (data as any).salon_id,
    });
    return this.repo.save(customer);
  }

  async update(id: number, data: Partial<Customer>) {
    await this.repo.update(id, {
      ...data,
      salon_id: (data as any).salonId ?? (data as any).salon_id,
    });
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    return customer;
  }

  async remove(id: number) {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }
}