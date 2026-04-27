import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
  ) {}

  findBySalon(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Customer>> {
    return paginateRepository(this.repo, pagination, {
      where: { salon_id: salonId },
      order: { name: 'ASC' },
    });
  }

  findByPhone(phone: string, salonId: number) {
    return this.repo.findOne({ where: { phone, salon_id: salonId } });
  }

  create(data: Partial<Customer>) {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async update(id: number, data: Partial<Customer>, salonId?: number) {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    if (salonId && customer.salon_id !== salonId) {
      throw new ForbiddenException('Customer does not belong to your salon');
    }
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number, salonId?: number) {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    if (salonId && customer.salon_id !== salonId) {
      throw new ForbiddenException('Customer does not belong to your salon');
    }
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }
}