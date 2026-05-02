// transactions/transactions.service.ts
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';
import { TransactionPayment } from './transaction-payment.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateQueryBuilder } from '../common/helpers/paginate.helper';
import { ShiftsService } from '../shifts/shifts.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { Salon } from '../salons/salon.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private repo: Repository<Transaction>,
    @InjectRepository(Salon)
    private salonRepo: Repository<Salon>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    private dataSource: DataSource,
    private shiftsService: ShiftsService,
    private loyaltyService: LoyaltyService,
  ) {}

  async create(body: CreateTransactionDto): Promise<Transaction> {
    const itemsInput = body.items ?? [];
    if (itemsInput.length === 0) {
      throw new BadRequestException('items are required');
    }

    // ── #6 Tax: Read salon config ──────────────────────────
    const salon = await this.salonRepo.findOne({ where: { id: body.salon_id } });
    if (!salon) throw new NotFoundException('Salon not found');
    const taxRate = Number(salon.taxRate) || 0;

    return this.dataSource.transaction(async manager => {
      const appointmentId = body.appointment_id ?? undefined;
      const transactionItemRepo = manager.getRepository(TransactionItem);
      const transactionPaymentRepo = manager.getRepository(TransactionPayment);

      // ── #5 Discount: Calculate item-level discounts ──────
      let subtotal = 0;
      const processedItems = itemsInput.map(item => {
        let itemDiscountAmount = 0;
        if (item.discount_type && item.discount_value) {
          if (item.discount_type === 'percentage') {
            itemDiscountAmount = (Number(item.price) * Number(item.discount_value)) / 100;
          } else {
            itemDiscountAmount = Number(item.discount_value);
          }
        }
        const netPrice = Number(item.price) - itemDiscountAmount;
        subtotal += netPrice;
        return { ...item, discountAmount: itemDiscountAmount, netPrice };
      });

      // ── #5 Discount: Transaction-level discount ──────────
      let txDiscountAmount = 0;
      if (body.discount_type && body.discount_value) {
        if (body.discount_type === 'percentage') {
          txDiscountAmount = (subtotal * Number(body.discount_value)) / 100;
        } else {
          txDiscountAmount = Number(body.discount_value);
        }
      } else if (body.discount_amount) {
        txDiscountAmount = Number(body.discount_amount);
      }

      const afterDiscount = subtotal - txDiscountAmount;

      // ── #6 Tax: Auto-calculate ───────────────────────────
      const taxAmount = taxRate > 0 ? (afterDiscount * taxRate) / 100 : 0;

      // ── #3 Tip: Calculate and distribute ─────────────────
      const totalTip = Number(body.tip_amount) || 0;
      // Check if tips are provided per-item
      const hasPerItemTips = processedItems.some(i => i.tip_amount && i.tip_amount > 0);

      // ── Calculate total ──────────────────────────────────
      const totalAmount = afterDiscount + taxAmount + totalTip;

      // ── #2 Split Payment: Validate ───────────────────────
      const payments = body.payments ?? [];
      let paymentMethod = body.payment_method;
      if (payments.length > 1) {
        const paymentTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        if (Math.abs(paymentTotal - totalAmount) > 0.01) {
          throw new BadRequestException(
            `Payment total (${paymentTotal}) does not match transaction total (${totalAmount})`,
          );
        }
        paymentMethod = 'split';
      }

      // ── #1 Shift: Find current shift ─────────────────────
      const currentShift = await this.shiftsService.getCurrentShift(body.salon_id);
      const shiftId = currentShift?.id ?? null;

      // ── #4 Customer: Resolve from appointment ────────────
      let customerId = body.customer_id ?? null;
      if (!customerId && appointmentId) {
        const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
        if (appointment?.customer_id) {
          customerId = appointment.customer_id;
        }
      }

      // ── Create transaction ───────────────────────────────
      const transaction = manager.create(Transaction, {
        appointmentId,
        salonId: body.salon_id,
        shiftId,
        customerId,
        subtotal: body.subtotal,
        discountType: body.discount_type ?? undefined,
        discountValue: body.discount_value ?? 0,
        discountAmount: txDiscountAmount,
        discountReason: body.discount_reason ?? undefined,
        taxRate,
        taxAmount,
        tipAmount: totalTip,
        totalAmount,
        paymentMethod,
        status: body.status ?? 'paid',
        note: body.note,
        paidAt: new Date(),
      } as any);

      const savedTransaction = await manager.save(Transaction, transaction);

      // ── Create items with tip distribution ───────────────
      const items = processedItems.map(item => {
        // #3 Tip distribution by price ratio
        let itemTip = 0;
        if (hasPerItemTips) {
          itemTip = Number(item.tip_amount) || 0;
        } else if (totalTip > 0 && subtotal > 0) {
          // Distribute tip by price ratio
          itemTip = (item.netPrice / subtotal) * totalTip;
          itemTip = Math.round(itemTip * 100) / 100; // round to 2 decimals
        }

        return transactionItemRepo.create({
          transactionId: savedTransaction.id,
          serviceId: item.service_id,
          staffId: item.staff_id ?? undefined,
          serviceName: item.service_name,
          price: item.price,
          discountType: item.discount_type ?? null,
          discountValue: item.discount_value ?? 0,
          discountAmount: item.discountAmount,
          discountReason: item.discount_reason ?? null,
          tipAmount: itemTip,
          commissionRate: item.commission_rate,
          commissionAmount: (Number(item.price) * Number(item.commission_rate)) / 100,
        } as any);
      });

      await transactionItemRepo.save(items as any);

      // ── #2 Split Payment: Save payment records ───────────
      if (payments.length > 0) {
        const paymentEntities = payments.map(p =>
          transactionPaymentRepo.create({
            transactionId: savedTransaction.id,
            paymentMethod: p.payment_method,
            amount: p.amount,
            reference: p.reference ?? undefined,
          }),
        );
        await transactionPaymentRepo.save(paymentEntities);
      } else {
        // Single payment — create one record
        await transactionPaymentRepo.save(
          transactionPaymentRepo.create({
            transactionId: savedTransaction.id,
            paymentMethod: body.payment_method,
            amount: totalAmount,
          }),
        );
      }

      // ── #1 Shift: Update running totals ──────────────────
      if (payments.length > 1) {
        // Split payment: record each payment method separately
        for (const p of payments) {
          await this.shiftsService.recordTransaction(
            body.salon_id,
            p.payment_method,
            Number(p.amount),
            0, // tip is tracked at transaction level
          );
        }
        // Record tip separately to shift
        if (totalTip > 0) {
          await this.shiftsService.recordTransaction(body.salon_id, 'tip', 0, totalTip);
        }
      } else {
        await this.shiftsService.recordTransaction(
          body.salon_id,
          body.payment_method,
          totalAmount - totalTip,
          totalTip,
        );
      }

      // ── #4 Customer Stats: Auto-update ───────────────────
      if (customerId && (body.status ?? 'paid') === 'paid') {
        await manager
          .createQueryBuilder()
          .update('customers')
          .set({
            total_visits: () => 'total_visits + 1',
            total_spent: () => `total_spent + ${totalAmount}`,
          })
          .where('id = :id', { id: customerId })
          .execute();

        // ── Loyalty Points: Auto-earn points ───────────────
        // This is done outside the transaction since it uses its own service
        // We'll call it after the transaction is committed
        setTimeout(async () => {
          try {
            await this.loyaltyService.earnPoints(
              customerId,
              body.salon_id,
              savedTransaction.id,
              totalAmount,
            );
          } catch (error) {
            console.error('Failed to award loyalty points:', error);
          }
        }, 0);
      }

      return manager.findOneOrFail(Transaction, {
        where: { id: savedTransaction.id },
        relations: ['items', 'payments'],
      });
    });
  }

  async findBySalon(salonId: number, pagination: PaginationDto, date?: string, startDate?: string, endDate?: string): Promise<PaginatedResult<Transaction>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {
      salonId,
      status: 'paid',
    };

    // Add date filter using query builder for complex date conditions
    let query = this.repo.createQueryBuilder('t');

    if (date) {
      query = query.andWhere(`DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = :date`, { date });
    } else if (startDate && endDate) {
      query = query.andWhere(`DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= :startDate`, { startDate });
      query = query.andWhere(`DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= :endDate`, { endDate });
    }

    // Get data without joins first
    const [data, total] = await query
      .where('t.salon_id = :salonId', { salonId })
      .andWhere('t.status = :status', { status: 'paid' })
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Load relations separately
    const transactionIds = data.map(t => t.id);
    const items = await this.dataSource.getRepository(TransactionItem).find({
      where: { transactionId: In(transactionIds) } as any,
    });
    const payments = await this.dataSource.getRepository(TransactionPayment).find({
      where: { transactionId: In(transactionIds) } as any,
    });

    // Attach relations to transactions
    const dataWithRelations = data.map(transaction => ({
      ...transaction,
      items: items.filter(item => item.transactionId === transaction.id),
      payments: payments.filter(payment => payment.transactionId === transaction.id),
    }));

    // Sort by paidAt DESC
    dataWithRelations.sort((a, b) => {
      const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return dateB - dateA;
    });

    return {
      data: dataWithRelations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByAppointment(appointmentId: number, salonId?: number): Promise<Transaction> {
    const item = await this.repo.findOne({
      where: { appointmentId },
      relations: ['items', 'payments'],
    });
    if (!item) throw new NotFoundException('Transaction not found');
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Transaction does not belong to your salon');
    }
    return item;
  }

  async getDailyReport(salonId: number, date: string) {
    const result = await this.repo.createQueryBuilder('t')
      .select('SUM(t.total_amount)', 'totalRevenue')
      .addSelect('SUM(t.tip_amount)', 'totalTips')
      .addSelect('SUM(t.discount_amount)', 'totalDiscounts')
      .addSelect('SUM(t.tax_amount)', 'totalTax')
      .addSelect('COUNT(*)', 'totalTransactions')
      .where('t.salon_id = :salonId', { salonId })
      .andWhere('t.status = :status', { status: 'paid' })
      .andWhere(`DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = :date`, { date })
      .getRawOne();

    return {
      date,
      totalRevenue: Number(result.totalRevenue) || 0,
      totalTips: Number(result.totalTips) || 0,
      totalDiscounts: Number(result.totalDiscounts) || 0,
      totalTax: Number(result.totalTax) || 0,
      totalTransactions: Number(result.totalTransactions) || 0,
    };
  }

  async refund(id: number, salonId?: number): Promise<Transaction> {
    const item = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!item) throw new NotFoundException('Transaction not found');
    if (salonId && item.salonId !== salonId) {
      throw new ForbiddenException('Transaction does not belong to your salon');
    }

    await this.repo.update(id, { status: 'refunded' });

    // #1 Shift: Record refund
    await this.shiftsService.recordTransaction(
      item.salonId,
      item.paymentMethod,
      Number(item.totalAmount),
      0,
      true, // isRefund
    );

    // #4 Customer Stats: Decrement
    if (item.customerId) {
      await this.customerRepo
        .createQueryBuilder()
        .update()
        .set({
          total_spent: () => `GREATEST(total_spent - ${Number(item.totalAmount)}, 0)`,
        })
        .where('id = :id', { id: item.customerId })
        .execute();
    }

    return this.repo.findOneOrFail({ where: { id }, relations: ['items', 'payments'] });
  }

  async getCommissionReport(salonId: number, date: string) {
    const rows = await this.dataSource.query(
      `
        SELECT
          ti.staff_id AS "staffId",
          s.name AS "staffName",
          COUNT(*) AS "serviceCount",
          COALESCE(SUM(ti.price), 0) AS "grossSales",
          COALESCE(SUM(ti.commission_amount), 0) AS "commissionAmount",
          COALESCE(SUM(ti.tip_amount), 0) AS "tipAmount"
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
    const totalTips = rows.reduce(
      (sum: number, row: any) => sum + Number(row.tipAmount || 0),
      0,
    );

    return {
      salonId,
      date,
      totalCommission,
      totalTips,
      items: rows.map((row: any) => ({
        staffId: row.staffId ? Number(row.staffId) : null,
        staffName: row.staffName,
        serviceCount: Number(row.serviceCount || 0),
        grossSales: Number(row.grossSales || 0),
        commissionAmount: Number(row.commissionAmount || 0),
        tipAmount: Number(row.tipAmount || 0),
      })),
    };
  }

  async getServicePopularityReport(salonId: number, startDate?: string, endDate?: string) {
    let dateFilter = '';
    const params: any[] = [salonId];

    if (startDate && endDate) {
      dateFilter = `AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $2 AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $3`;
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $2`;
      params.push(startDate);
    }

    const rows = await this.dataSource.query(
      `
        SELECT
          ti.service_id AS "serviceId",
          ti.service_name AS "serviceName",
          s.category_id AS "categoryId",
          sc.name AS "categoryName",
          sc.color AS "categoryColor",
          COUNT(*) AS "serviceCount",
          COALESCE(SUM(ti.price), 0) AS "totalRevenue",
          COALESCE(AVG(ti.price), 0) AS "averagePrice"
        FROM transaction_items ti
        INNER JOIN transactions t ON t.id = ti.transaction_id
        LEFT JOIN services s ON s.id = ti.service_id
        LEFT JOIN service_categories sc ON sc.id = s.category_id
        WHERE t.salon_id = $1
          AND t.status = 'paid'
          ${dateFilter}
        GROUP BY ti.service_id, ti.service_name, s.category_id, sc.name, sc.color
        ORDER BY "serviceCount" DESC
      `,
      params,
    );

    const totalServices = rows.reduce(
      (sum: number, row: any) => sum + Number(row.serviceCount || 0),
      0,
    );
    const totalRevenue = rows.reduce(
      (sum: number, row: any) => sum + Number(row.totalRevenue || 0),
      0,
    );

    return {
      salonId,
      startDate,
      endDate,
      totalServices,
      totalRevenue,
      items: rows.map((row: any) => ({
        serviceId: row.serviceId ? Number(row.serviceId) : null,
        serviceName: row.serviceName,
        categoryId: row.categoryId ? Number(row.categoryId) : null,
        categoryName: row.categoryName,
        categoryColor: row.categoryColor,
        serviceCount: Number(row.serviceCount || 0),
        totalRevenue: Number(row.totalRevenue || 0),
        averagePrice: Number(row.averagePrice || 0),
        revenuePercentage: totalRevenue > 0
          ? (Number(row.totalRevenue || 0) / totalRevenue) * 100
          : 0,
      })),
    };
  }

  async getCustomerAnalyticsReport(salonId: number, startDate?: string, endDate?: string) {
    let dateFilter = '';
    const params: any[] = [salonId];

    if (startDate && endDate) {
      dateFilter = `AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $2 AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $3`;
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $2`;
      params.push(startDate);
    }

    const rows = await this.dataSource.query(
      `
        SELECT
          c.id AS "customerId",
          c.name AS "customerName",
          c.phone AS "customerPhone",
          COALESCE(c.total_visits, 0) AS "totalVisits",
          COALESCE(c.total_spent, 0) AS "totalSpent",
          COALESCE(c.total_spent, 0) / NULLIF(COALESCE(c.total_visits, 0), 0) AS "averageSpend",
          MAX(t.paid_at) AS "lastVisitDate"
        FROM customers c
        INNER JOIN transactions t ON t.customer_id = c.id
        WHERE c.salon_id = $1
          AND t.status = 'paid'
          ${dateFilter}
        GROUP BY c.id, c.name, c.phone, c.total_visits, c.total_spent
        ORDER BY "totalSpent" DESC
        LIMIT 50
      `,
      params,
    );

    const totalCustomers = rows.length;
    const totalRevenue = rows.reduce(
      (sum: number, row: any) => sum + Number(row.totalSpent || 0),
      0,
    );
    const totalVisits = rows.reduce(
      (sum: number, row: any) => sum + Number(row.totalVisits || 0),
      0,
    );

    return {
      salonId,
      startDate,
      endDate,
      totalCustomers,
      totalRevenue,
      totalVisits,
      averageRevenuePerCustomer: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      items: rows.map((row: any) => ({
        customerId: row.customerId ? Number(row.customerId) : null,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        totalVisits: Number(row.totalVisits || 0),
        totalSpent: Number(row.totalSpent || 0),
        averageSpend: Number(row.averageSpend || 0),
        lastVisitDate: row.lastVisitDate,
        revenuePercentage: totalRevenue > 0
          ? (Number(row.totalSpent || 0) / totalRevenue) * 100
          : 0,
      })),
    };
  }

  async getPaymentMethodReport(salonId: number, date: string) {
    const rows = await this.dataSource.query(
      `
        SELECT 
          tp.payment_method AS "paymentMethod",
          COUNT(*) AS "transactionCount",
          COALESCE(SUM(tp.amount), 0) AS "totalAmount"
        FROM transaction_payments tp
        INNER JOIN transactions t ON t.id = tp.transaction_id
        WHERE t.salon_id = $1
          AND t.status = 'paid'
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2
        GROUP BY tp.payment_method
        ORDER BY "totalAmount" DESC
      `,
      [salonId, date],
    );

    const totalAmount = rows.reduce(
      (sum: number, row: any) => sum + Number(row.totalAmount || 0),
      0,
    );
    const totalTransactions = rows.reduce(
      (sum: number, row: any) => sum + Number(row.transactionCount || 0),
      0,
    );

    return {
      salonId,
      date,
      totalAmount,
      totalTransactions,
      items: rows.map((row: any) => ({
        paymentMethod: row.paymentMethod,
        transactionCount: Number(row.transactionCount || 0),
        totalAmount: Number(row.totalAmount || 0),
        percentage: totalAmount > 0 ? (Number(row.totalAmount || 0) / totalAmount) * 100 : 0,
      })),
    };
  }
}