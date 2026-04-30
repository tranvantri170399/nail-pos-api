// src/waiting-list/waiting-list.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WaitingListService } from './waiting-list.service';
import { CreateWaitingListDto, UpdateWaitingListDto } from './dto/create-waiting-list.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('waiting-list')
export class WaitingListController {
  constructor(private readonly service: WaitingListService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateWaitingListDto) {
    return this.service.create(user.salonId, body);
  }

  @Get()
  findBySalon(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.service.findBySalon(user.salonId, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.salonId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWaitingListDto,
  ) {
    return this.service.update(id, user.salonId, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.salonId);
  }

  @Post(':id/assign/:staffId')
  assignStaff(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('staffId', ParseIntPipe) staffId: number,
  ) {
    return this.service.assignStaff(id, user.salonId, staffId);
  }

  @Post('next')
  moveToNext(@CurrentUser() user: any) {
    return this.service.moveToNext(user.salonId);
  }
}
