// loyalty/loyalty.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto, AdjustPointsDto } from './dto/loyalty.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('redeem')
  redeemPoints(@CurrentUser() user: any, @Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeemPoints(dto, user.salonId);
  }

  @Post('adjust')
  adjustPoints(@CurrentUser() user: any, @Body() dto: AdjustPointsDto) {
    return this.loyaltyService.adjustPoints(dto, user.salonId);
  }

  @Get('customer/:id/history')
  getCustomerHistory(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) customerId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.loyaltyService.getCustomerHistory(customerId, user.salonId, pagination);
  }

  @Get('customer/:id/summary')
  getCustomerSummary(@Param('id', ParseIntPipe) customerId: number) {
    return this.loyaltyService.getCustomerSummary(customerId);
  }

  @Get('config')
  getConfig() {
    return this.loyaltyService.getConfig();
  }

  @Post('config')
  updateConfig(@Body() config: any) {
    return this.loyaltyService.updateConfig(config);
  }
}
