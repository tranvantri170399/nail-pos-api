// staffs/staffs.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('staffs')
export class StaffsController {
  private readonly logger = new Logger(StaffsController.name);

  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
    @Query('salonId') querySalonId?: string,
  ) {
    // Owner can pass salonId, staff always uses their own
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;

    this.logger.log(`GET /staffs - user: ${JSON.stringify({ id: user.sub, type: user.type, salonId: user.salonId })}, querySalonId: ${querySalonId}, final salonId: ${salonId}, pagination: ${JSON.stringify(pagination)}`);

    return this.staffsService.findBySalon(salonId, pagination);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateStaffDto) {
    // Enforce salon_id from JWT for staff, or validate for owner
    const salonId = user.type === 'owner'
      ? ((body as any).salonId ?? (body as any).salon_id ?? user.salonId)
      : user.salonId;
    return this.staffsService.create({ ...body, salonId });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStaffDto,
  ) {
    const salonId = user.type === 'owner' ? (user.salonId ?? undefined) : user.salonId;
    return this.staffsService.update(id, body, salonId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    const salonId = user.type === 'owner' ? (user.salonId ?? undefined) : user.salonId;
    return this.staffsService.remove(id, salonId);
  }
}