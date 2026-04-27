// transactions/transactions.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('transactions')
export class TransactionsController {

  constructor(private readonly service: TransactionsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateTransactionDto) {
    // Enforce salonId from JWT
    const salonId = user.type === 'owner'
      ? (body.salon_id ?? user.salonId)
      : user.salonId;
    return this.service.create({ ...body, salon_id: salonId });
  }

  @Get()
  findBySalon(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
    @Query('date') date?: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.findBySalon(salonId, pagination, date);
  }

  @Get('report')
  getDailyReport(
    @CurrentUser() user: any,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getDailyReport(salonId, date);
  }

  @Get('report/commission')
  getCommissionReport(
    @CurrentUser() user: any,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getCommissionReport(salonId, date);
  }

  @Get('appointment/:id')
  findByAppointment(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findByAppointment(id, user.salonId);
  }

  @Patch(':id/refund')
  refund(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.refund(id, user.salonId);
  }
}