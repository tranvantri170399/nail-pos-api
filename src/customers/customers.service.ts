import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
  ) {}

  findAll() { return this.repo.find(); }

  findByPhone(phone: string) {
    return this.repo.findOne({ where: { phone } });
  }

  create(data: Partial<Customer>) {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }
}