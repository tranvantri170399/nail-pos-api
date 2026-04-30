// src/schedules/schedules.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/create-schedule.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateScheduleDto) {
    return this.service.create(user.salonId, body);
  }

  @Get()
  findBySalon(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findBySalon(user.salonId, status, date);
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
    @Body() body: UpdateScheduleDto,
  ) {
    return this.service.update(id, user.salonId, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.salonId);
  }
}
