// staffs/staffs.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@UseGuards(JwtAuthGuard)
@Controller('staffs')
export class StaffsController {

  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  findAll(@Query('salonId') salonId?: string) {  
    return salonId
      ? this.staffsService.findBySalon(Number(salonId))
      : this.staffsService.findAll();
  }

  @Post()
  create(@Body() body: CreateStaffDto) {
    return this.staffsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateStaffDto) {
    return this.staffsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffsService.remove(+id);
  }
}