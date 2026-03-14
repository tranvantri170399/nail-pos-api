// transactions/transactions.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  create(@Body() body: any) {
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

  @Get('appointment/:id')
  findByAppointment(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByAppointment(id);
  }

  @Patch(':id/refund')
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.service.refund(id);
  }
}