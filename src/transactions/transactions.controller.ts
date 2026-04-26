// transactions/transactions.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {

  constructor(private readonly service: TransactionsService) {}

  @Post()
  create(@Body() body: CreateTransactionDto) {
    return this.service.create(body);
  }

  @Get()
  findBySalon(
    @Query('salonId', ParseIntPipe) salonId: number,
    @Query('date') date?: string,
  ) {
    return this.service.findBySalon(salonId, date);
  }

  @Get('report')
  getDailyReport(
    @Query('salonId', ParseIntPipe) salonId: number,
    @Query('date') date: string,
  ) {
    return this.service.getDailyReport(salonId, date);
  }

  @Get('report/commission')
  getCommissionReport(
    @Query('salonId', ParseIntPipe) salonId: number,
    @Query('date') date: string,
  ) {
    return this.service.getCommissionReport(salonId, date);
  }

  @Get('appointment/:id')
  findByAppointment(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByAppointment(id);
  }

  @Patch(':id/refund')
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.service.refund(id);
  }
}