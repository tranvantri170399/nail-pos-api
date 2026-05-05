// src/payrolls/payrolls.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payroll } from './payroll.entity';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/create-payroll.dto';

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(Payroll)
    private repo: Repository<Payroll>,
    private dataSource: DataSource,
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

  /**
   * Tính commission & tip thực tế từ transaction_items cho 1 staff trong khoảng thời gian
   * rồi tạo hoặc cập nhật Payroll record.
   */
  async generateCommissionPayroll(
    salonId: number,
    staffId: number,
    startDate: string,
    endDate: string,
  ): Promise<Payroll> {
    const rows = await this.dataSource.query(
      `
        SELECT
          COALESCE(SUM(ti.commission_amount), 0) AS total_commission,
          COALESCE(SUM(ti.tip_amount), 0)        AS total_tip
        FROM transaction_items ti
        INNER JOIN transactions t ON t.id = ti.transaction_id
        WHERE t.salon_id = $1
          AND ti.staff_id = $2
          AND t.status = 'paid'
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $3
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $4
      `,
      [salonId, staffId, startDate, endDate],
    );

    const totalCommission = Number(rows[0]?.total_commission ?? 0);
    const totalTip = Number(rows[0]?.total_tip ?? 0);
    const totalAmount = totalCommission + totalTip;

    const payroll = this.repo.create({
      salon_id: salonId,
      staff_id: staffId,
      commission_amount: totalCommission,
      tip_amount: totalTip,
      total_amount: totalAmount,
      period_start: new Date(startDate),
      period_end: new Date(endDate),
      status: 'pending',
      notes: `Auto-generated: ${startDate} → ${endDate}`,
    });
    return this.repo.save(payroll);
  }

  /**
   * Tạo payroll cho TẤT CẢ staff có giao dịch trong khoảng thời gian.
   * Trả về danh sách payroll đã tạo.
   */
  async generateAllStaffPayroll(
    salonId: number,
    startDate: string,
    endDate: string,
  ): Promise<Payroll[]> {
    // Lấy danh sách staff có giao dịch trong kỳ
    const staffRows = await this.dataSource.query(
      `
        SELECT
          ti.staff_id,
          s.name AS staff_name,
          COALESCE(SUM(ti.commission_amount), 0) AS total_commission,
          COALESCE(SUM(ti.tip_amount), 0)        AS total_tip
        FROM transaction_items ti
        INNER JOIN transactions t ON t.id = ti.transaction_id
        LEFT JOIN staffs s ON s.id = ti.staff_id
        WHERE t.salon_id = $1
          AND ti.staff_id IS NOT NULL
          AND t.status = 'paid'
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $2
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $3
        GROUP BY ti.staff_id, s.name
        ORDER BY total_commission DESC
      `,
      [salonId, startDate, endDate],
    );

    if (staffRows.length === 0) {
      return [];
    }

    // Tạo payroll records cho từng staff
    const payrolls = staffRows.map((row: any) => {
      const commission = Number(row.total_commission);
      const tip = Number(row.total_tip);
      return this.repo.create({
        salon_id: salonId,
        staff_id: Number(row.staff_id),
        commission_amount: commission,
        tip_amount: tip,
        total_amount: commission + tip,
        period_start: new Date(startDate),
        period_end: new Date(endDate),
        status: 'pending',
        notes: `Auto-generated: ${startDate} → ${endDate}`,
      });
    });

    return this.repo.save(payrolls);
  }

  /**
   * Preview commission cho tất cả staff (không lưu DB) — dùng cho dialog confirm
   */
  async previewAllStaffCommission(
    salonId: number,
    startDate: string,
    endDate: string,
  ): Promise<Array<{ staffId: number; staffName: string; commission: number; tip: number; total: number }>> {
    const rows = await this.dataSource.query(
      `
        SELECT
          ti.staff_id     AS "staffId",
          s.name          AS "staffName",
          COALESCE(SUM(ti.commission_amount), 0) AS commission,
          COALESCE(SUM(ti.tip_amount), 0)        AS tip
        FROM transaction_items ti
        INNER JOIN transactions t ON t.id = ti.transaction_id
        LEFT JOIN staffs s ON s.id = ti.staff_id
        WHERE t.salon_id = $1
          AND ti.staff_id IS NOT NULL
          AND t.status = 'paid'
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $2
          AND DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $3
        GROUP BY ti.staff_id, s.name
        ORDER BY commission DESC
      `,
      [salonId, startDate, endDate],
    );

    return rows.map((row: any) => ({
      staffId: Number(row.staffId),
      staffName: row.staffName ?? 'Unknown',
      commission: Number(row.commission),
      tip: Number(row.tip),
      total: Number(row.commission) + Number(row.tip),
    }));
  }
}
