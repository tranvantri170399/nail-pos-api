// staffs/staffs.controller.ts
import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { StaffsService } from './staffs.service';

@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  findAll(@Query('salonId', ParseIntPipe) salonId: number) {  // ← thêm
    return this.staffsService.findBySalon(salonId);
  }
}