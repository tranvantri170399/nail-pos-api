// shifts/shifts.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './shift.entity';
import { CashMovement } from './cash-movement.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private shiftRepo: Repository<Shift>,
    @InjectRepository(CashMovement)
    private cashMovementRepo: Repository<CashMovement>,
  ) {}

  async openShift(salonId: number, staffId: number, startingCash: number): Promise<Shift> {
    // Check if there's already an open shift for this salon
    const existing = await this.shiftRepo.findOne({
      where: { salonId, status: 'open' },
    });
    if (existing) {
      throw new BadRequestException('There is already an open shift for this salon. Close it first.');
    }

    const shift = this.shiftRepo.create({
      salonId,
      openedBy: staffId,
      startingCash,
      status: 'open',
    });
    return this.shiftRepo.save(shift);
  }

  async closeShift(shiftId: number, salonId: number, staffId: number, endingCash: number, closeNote?: string): Promise<Shift> {
    const shift = await this.shiftRepo.findOne({ where: { id: shiftId, salonId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'closed') throw new BadRequestException('Shift is already closed');

    // Calculate expected cash
    const expectedCash = Number(shift.startingCash)
      + Number(shift.totalCashSales)
      + Number(shift.cashInTotal)
      - Number(shift.cashOutTotal)
      - Number(shift.totalRefunds);

    const cashDifference = endingCash - expectedCash;

    shift.closedBy = staffId;
    shift.endingCash = endingCash;
    shift.expectedCash = expectedCash;
    shift.cashDifference = cashDifference;
    shift.status = 'closed';
    shift.closeNote = closeNote || '';
    shift.closedAt = new Date();

    return this.shiftRepo.save(shift);
  }

  async getCurrentShift(salonId: number): Promise<Shift | null> {
    return this.shiftRepo.findOne({
      where: { salonId, status: 'open' },
      relations: ['cashMovements'],
    });
  }

  async getShiftById(shiftId: number, salonId: number): Promise<Shift> {
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId, salonId },
      relations: ['cashMovements'],
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async getShiftHistory(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Shift>> {
    return paginateRepository(this.shiftRepo, pagination, {
      where: { salonId },
      order: { openedAt: 'DESC' },
    });
  }

  async addCashMovement(
    shiftId: number,
    salonId: number,
    staffId: number,
    type: string,
    amount: number,
    reason?: string,
  ): Promise<CashMovement> {
    const shift = await this.shiftRepo.findOne({ where: { id: shiftId, salonId, status: 'open' } });
    if (!shift) throw new NotFoundException('No open shift found');

    const movement = this.cashMovementRepo.create({
      shiftId,
      salonId,
      staffId,
      type,
      amount,
      reason,
    });
    await this.cashMovementRepo.save(movement);

    // Update shift totals
    if (type === 'cash_in') {
      shift.cashInTotal = Number(shift.cashInTotal) + amount;
    } else if (type === 'safe_drop') {
      shift.safeDropTotal = Number(shift.safeDropTotal || 0) + amount;
    } else {
      shift.cashOutTotal = Number(shift.cashOutTotal) + amount;
    }
    await this.shiftRepo.save(shift);

    return movement;
  }

  async getCashMovements(shiftId: number, salonId: number): Promise<CashMovement[]> {
    return this.cashMovementRepo.find({
      where: { shiftId, salonId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Called by TransactionsService when a transaction is created.
   * Updates the shift's running totals.
   */
  async recordTransaction(
    salonId: number,
    paymentMethod: string,
    amount: number,
    tipAmount: number,
    isRefund: boolean = false,
  ): Promise<void> {
    const shift = await this.shiftRepo.findOne({
      where: { salonId, status: 'open' },
    });
    if (!shift) return; // Shift is optional

    if (isRefund) {
      shift.totalRefunds = Number(shift.totalRefunds) + amount;
    } else {
      if (paymentMethod === 'cash') {
        shift.totalCashSales = Number(shift.totalCashSales) + amount;
      } else if (paymentMethod === 'card') {
        shift.totalCardSales = Number(shift.totalCardSales) + amount;
      } else {
        shift.totalOtherSales = Number(shift.totalOtherSales) + amount;
      }
      shift.totalTips = Number(shift.totalTips) + tipAmount;
      shift.transactionCount = shift.transactionCount + 1;
    }

    await this.shiftRepo.save(shift);
  }
}
