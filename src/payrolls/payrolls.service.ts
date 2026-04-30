// src/payrolls/payrolls.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll } from './payroll.entity';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/create-payroll.dto';

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(Payroll)
    private repo: Repository<Payroll>,
  ) {}

  async create(salonId: number, body: CreatePayrollDto): Promise<Payroll> {
    const totalAmount = Number(body.commission_amount) + Number(body.tip_amount);
    const payroll = this.repo.create({
      salon_id: salonId,
      staff_id: body.staff_id,
      commission_amount: body.commission_amount,
      tip_amount: body.tip_amount,
      total_amount: totalAmount,
      period_start: new Date(body.period_start),
      period_end: new Date(body.period_end),
      status: 'pending',
      notes: body.notes,
    });
    return this.repo.save(payroll);
  }

  async findBySalon(salonId: number, status?: string): Promise<Payroll[]> {
    const where: any = { salon_id: salonId };
    if (status) {
      where.status = status;
    }
    return this.repo.find({
      where,
      order: { created_at: 'DESC' },
      relations: ['staff'],
    });
  }

  async findByStaff(salonId: number, staffId: number): Promise<Payroll[]> {
    return this.repo.find({
      where: { salon_id: salonId, staff_id: staffId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, salonId: number): Promise<Payroll> {
    const payroll = await this.repo.findOne({
      where: { id },
      relations: ['staff'],
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    if (payroll.salon_id !== salonId) {
      throw new ForbiddenException('Payroll does not belong to your salon');
    }
    return payroll;
  }

  async update(id: number, salonId: number, body: UpdatePayrollDto): Promise<Payroll> {
    const payroll = await this.findOne(id, salonId);

    if (body.status === 'paid' && payroll.status !== 'paid') {
      payroll.paid_at = new Date();
    }

    Object.assign(payroll, body);
    return this.repo.save(payroll);
  }

  async remove(id: number, salonId: number): Promise<void> {
    const payroll = await this.findOne(id, salonId);
    await this.repo.remove(payroll);
  }

  async generateCommissionPayroll(salonId: number, staffId: number, startDate: string, endDate: string): Promise<Payroll> {
    // Calculate commission from transactions for the period
    // This would query transaction_items and sum commission_amount + tip_amount
    // For now, return a placeholder
    const totalAmount = 0;

    const payroll = this.repo.create({
      salon_id: salonId,
      staff_id: staffId,
      commission_amount: 0,
      tip_amount: 0,
      total_amount: totalAmount,
      period_start: new Date(startDate),
      period_end: new Date(endDate),
      status: 'pending',
      notes: 'Auto-generated from commission report',
    });
    return this.repo.save(payroll);
  }
}
