// transactions/transactions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private repo: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async create(body: any): Promise<Transaction> {
    return this.dataSource.transaction(async manager => {
      const total = body.subtotal
        - (body.discountAmount ?? 0)
        + (body.tipAmount ?? 0)
        + (body.taxAmount ?? 0);

      const items = body.items.map((item: any) => ({
        ...item,
        commissionAmount: (item.price * item.commissionRate) / 100,
      }));

      return manager.save(Transaction, manager.create(Transaction, {
        ...body,
        totalAmount: total,
        status: 'paid',
        paidAt: new Date(),
        items,
      }));
    });
  }

  async findBySalon(salonId: number, date?: string): Promise<Transaction[]> {
    const query = this.repo.createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'items')
      .where('t.salon_id = :salonId', { salonId })
      .andWhere('t.status = :status', { status: 'paid' });

    if (date) query.andWhere('DATE(t.paid_at) = :date', { date });

    return query.orderBy('t.paid_at', 'DESC').getMany();
  }

  async findByAppointment(appointmentId: number): Promise<Transaction> {
    const item = await this.repo.findOne({
      where: { appointmentId },
      relations: ['items'],
    });
    if (!item) throw new NotFoundException('Transaction not found');
    return item;
  }

  async getDailyReport(salonId: number, date: string) {
    const result = await this.repo.createQueryBuilder('t')
      .select('SUM(t.total_amount)', 'totalRevenue')
      .addSelect('SUM(t.tip_amount)', 'totalTips')
      .addSelect('COUNT(*)', 'totalTransactions')
      .where('t.salon_id = :salonId', { salonId })
      .andWhere('t.status = :status', { status: 'paid' })
      .andWhere('DATE(t.paid_at) = :date', { date })
      .getRawOne();

    return {
      date,
      totalRevenue: Number(result.totalRevenue) || 0,
      totalTips: Number(result.totalTips) || 0,
      totalTransactions: Number(result.totalTransactions) || 0,
    };
  }

  async refund(id: number): Promise<Transaction> {
    await this.repo.update(id, { status: 'refunded' });
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Transaction not found');
    return item;
  }
}