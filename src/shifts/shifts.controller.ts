// shifts/shifts.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto, CloseShiftDto, CashMovementDto } from './dto/shift.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  @Post('open')
  openShift(@CurrentUser() user: any, @Body() body: OpenShiftDto) {
    return this.service.openShift(user.salonId, user.id, body.starting_cash);
  }

  @Post(':id/close')
  closeShift(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CloseShiftDto,
  ) {
    return this.service.closeShift(id, user.salonId, user.id, body.ending_cash, body.close_note);
  }

  @Get('current')
  getCurrentShift(@CurrentUser() user: any) {
    return this.service.getCurrentShift(user.salonId);
  }

  @Get()
  getShiftHistory(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.getShiftHistory(user.salonId, pagination);
  }

  @Get(':id')
  getShiftById(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getShiftById(id, user.salonId);
  }

  @Post(':id/cash-movement')
  addCashMovement(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CashMovementDto,
  ) {
    return this.service.addCashMovement(id, user.salonId, user.id, body.type, body.amount, body.reason);
  }

  @Get(':id/cash-movements')
  getCashMovements(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getCashMovements(id, user.salonId);
  }
}
