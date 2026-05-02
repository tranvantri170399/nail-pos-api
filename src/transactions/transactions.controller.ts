// transactions/transactions.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('transactions')
export class TransactionsController {

  constructor(private readonly service: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateTransactionDto) {
    // Enforce salonId from JWT
    const salonId = user.type === 'owner'
      ? (body.salon_id ?? user.salonId)
      : user.salonId;
    return this.service.create({ ...body, salon_id: salonId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions for a salon' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  findBySalon(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.findBySalon(salonId, pagination, date, startDate, endDate);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get daily revenue report' })
  @ApiResponse({ status: 200, description: 'Returns daily report' })
  getDailyReport(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getDailyReport(salonId, date);
  }

  @Get('report/commission')
  @ApiOperation({ summary: 'Get commission report' })
  @ApiResponse({ status: 200, description: 'Returns commission report' })
  getCommissionReport(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getCommissionReport(salonId, date);
  }

  @Get('report/service-popularity')
  @ApiOperation({ summary: 'Get service popularity report' })
  @ApiResponse({ status: 200, description: 'Returns service popularity report' })
  getServicePopularityReport(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getServicePopularityReport(salonId, startDate, endDate);
  }

  @Get('report/customer-analytics')
  @ApiOperation({ summary: 'Get customer analytics report' })
  @ApiResponse({ status: 200, description: 'Returns customer analytics report' })
  getCustomerAnalyticsReport(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getCustomerAnalyticsReport(salonId, startDate, endDate);
  }

  @Get('report/payment-method')
  @ApiOperation({ summary: 'Get payment method report' })
  @ApiResponse({ status: 200, description: 'Returns payment method report' })
  getPaymentMethodReport(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.getPaymentMethodReport(salonId, date);
  }

  @Get('appointment/:id')
  @ApiOperation({ summary: 'Get transaction by appointment ID' })
  @ApiResponse({ status: 200, description: 'Returns transaction' })
  findByAppointment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findByAppointment(id, user.salonId);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction refunded successfully' })
  refund(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.service.refund(id, user.salonId);
  }
}