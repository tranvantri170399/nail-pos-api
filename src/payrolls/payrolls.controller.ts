// src/payrolls/payrolls.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PayrollsService } from './payrolls.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/create-payroll.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly service: PayrollsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreatePayrollDto) {
    return this.service.create(user.salonId, body);
  }

  @Get()
  findBySalon(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.service.findBySalon(user.salonId, status);
  }

  @Get('staff/:staffId')
  findByStaff(
    @CurrentUser() user: any,
    @Param('staffId', ParseIntPipe) staffId: number,
  ) {
    return this.service.findByStaff(user.salonId, staffId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.salonId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePayrollDto,
  ) {
    return this.service.update(id, user.salonId, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.salonId);
  }

  @Post('generate')
  generateCommissionPayroll(
    @CurrentUser() user: any,
    @Body() body: { staffId: number; startDate: string; endDate: string },
  ) {
    return this.service.generateCommissionPayroll(
      user.salonId,
      body.staffId,
      body.startDate,
      body.endDate,
    );
  }
}
