// src/time-clocks/time-clocks.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TimeClocksService } from './time-clocks.service';
import { CreateTimeClockDto, UpdateTimeClockDto } from './dto/create-time-clock.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('time-clocks')
export class TimeClocksController {
  constructor(private readonly service: TimeClocksService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateTimeClockDto) {
    return this.service.create(user.salonId, body);
  }

  @Post('clock-in/:staffId')
  clockIn(
    @CurrentUser() user: any,
    @Param('staffId', ParseIntPipe) staffId: number,
    @Body() body: { notes?: string },
  ) {
    return this.service.clockIn(user.salonId, staffId, body?.notes);
  }

  @Post('clock-out/:id')
  clockOut(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.clockOut(id, user.salonId);
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

  @Get('staff/:staffId/active')
  findActiveByStaff(
    @CurrentUser() user: any,
    @Param('staffId', ParseIntPipe) staffId: number,
  ) {
    return this.service.findActiveByStaff(user.salonId, staffId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.salonId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTimeClockDto,
  ) {
    return this.service.update(id, user.salonId, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.salonId);
  }
}
