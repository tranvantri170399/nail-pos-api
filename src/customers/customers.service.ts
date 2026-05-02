import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
  ) {}

  async findBySalon(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Customer>> {
    try {
      return paginateRepository(this.repo, pagination, {
        where: { salon_id: salonId },
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error('Error in findBySalon:', error);
      throw error;
    }
  }

  async findByPhone(phone: string, salonId: number) {
    try {
      return this.repo.findOne({ where: { phone, salon_id: salonId } });
    } catch (error) {
      this.logger.error('Error in findByPhone:', error);
      throw error;
    }
  }

  async create(data: Partial<Customer>) {
    try {
      const customer = this.repo.create(data);
      return this.repo.save(customer);
    } catch (error) {
      this.logger.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<Customer>, salonId?: number) {
    try {
      const customer = await this.repo.findOne({ where: { id } });
      if (!customer) throw new NotFoundException(`Customer #${id} not found`);
      if (salonId && customer.salon_id !== salonId) {
        throw new ForbiddenException('Customer does not belong to your salon');
      }
      await this.repo.update(id, data);
      return this.repo.findOne({ where: { id } });
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
      const customer = await this.repo.findOne({ where: { id } });
      if (!customer) throw new NotFoundException(`Customer #${id} not found`);
      if (salonId && customer.salon_id !== salonId) {
        throw new ForbiddenException('Customer does not belong to your salon');
      }
      await this.repo.delete(id);
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