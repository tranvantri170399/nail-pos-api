// transactions/transactions.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private repo: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async create(body: CreateTransactionDto): Promise<Transaction> {
    const itemsInput = body.items ?? [];
    if (itemsInput.length === 0) {
      throw new BadRequestException('items are required');
    }

    return this.dataSource.transaction(async manager => {
      const appointmentId = body.appointment_id ?? undefined;
      const discountAmount = body.discount_amount ?? 0;
      const tipAmount = body.tip_amount ?? 0;
      const taxAmount = body.tax_amount ?? 0;
      const total = body.subtotal - discountAmount + tipAmount + taxAmount;
      const transactionItemRepo = manager.getRepository(TransactionItem);

      const transaction = manager.create(Transaction, {
        appointmentId,
        salonId: body.salon_id,
        subtotal: body.subtotal,
        discountAmount,
        tipAmount,
        taxAmount,
        totalAmount: total,
        paymentMethod: body.payment_method,
        status: body.status ?? 'paid',
        note: body.note,
        paidAt: new Date(),
      });

      const savedTransaction = await manager.save(Transaction, transaction);

      const items = itemsInput.map((item) =>
        transactionItemRepo.create({
          transactionId: savedTransaction.id,
          serviceId: item.service_id,
          staffId: item.staff_id ?? undefined,
          serviceName: item.service_name,
          price: item.price,
          commissionRate: item.commission_rate,
          commissionAmount: (Number(item.price) * Number(item.commission_rate)) / 100,
        } as any),
      );

      await transactionItemRepo.save(items as any);

      return manager.findOneOrFail(Transaction, {
        where: { id: savedTransaction.id },
        relations: ['items'],
      });
    });
  }

  async findBySalon(salonId: number, date?: string): Promise<Transaction[]> {
    const query = this.repo.createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'items')
      .where('t.salon_id = :salonId', { salonId })
      .andWhere('t.status = :status', { status: 'paid' });

    if (date) query.andWhere(`DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = :date`, { date });

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
      .andWhere(`DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = :date`, { date })
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

  async getCommissionReport(salonId: number, date: string) {
    const rows = await this.dataSource.query(
      `
        SELECT
          ti.staff_id AS "staffId",
          s.name AS "staffName",
          COUNT(*) AS "serviceCount",
          COALESCE(SUM(ti.price), 0) AS "grossSales",
          COALESCE(SUM(ti.commission_amount), 0) AS "commissionAmount"
        FROM transaction_items ti
        INNER JOIN transactions t ON t.id = ti.transaction_id
        LEFT JOIN staffs s ON s.id = ti.staff_id
        WHERE t.salon_id = $1
          AND t.status = 'paid'
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2
        GROUP BY ti.staff_id, s.name
        ORDER BY "commissionAmount" DESC
      `,
      [salonId, date],
    );

    const totalCommission = rows.reduce(
      (sum: number, row: any) => sum + Number(row.commissionAmount || 0),
      0,
    );

    return {
      salonId,
      date,
      totalCommission,
      items: rows.map((row: any) => ({
        staffId: row.staffId ? Number(row.staffId) : null,
        staffName: row.staffName,
        serviceCount: Number(row.serviceCount || 0),
        grossSales: Number(row.grossSales || 0),
        commissionAmount: Number(row.commissionAmount || 0),
      })),
    };
  }
}