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
    console.log('Received body:', body);
    console.log('appointmentId:', body.appointmentId);
    console.log('appointment_id:', body.appointment_id);

    return this.dataSource.transaction(async manager => {
      const total = body.subtotal
        - (body.discountAmount ?? 0)
        + (body.tipAmount ?? 0)
        + (body.taxAmount ?? 0);

      console.log('Calculated total:', total);

      const items = body.items.map((item: any) => ({
        serviceId: item.service_id,
        staffId: item.staff_id,
        serviceName: item.service_name,
        price: item.price,
        commissionRate: item.commission_rate,
        commissionAmount: (item.price * item.commission_rate) / 100,
      }));

      console.log('Processed items:', items);

      const transactionData = {
        appointmentId: body.appointment_id || null,
        salonId: body.salon_id,
        subtotal: body.subtotal,
        discountAmount: body.discount_amount || 0,
        tipAmount: body.tip_amount || 0,
        taxAmount: body.tax_amount || 0,
        totalAmount: total,
        paymentMethod: body.payment_method,
        status: 'paid',
        note: body.note,
        paidAt: new Date(),
        items,
      };

      console.log('Final transaction data:', transactionData);

      return manager.save(Transaction, manager.create(Transaction, transactionData));
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