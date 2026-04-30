import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('appointments')
export class AppointmentsController {

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.appointmentsService.findBySalon(salonId, pagination);
  }

  @Get('by-date')
  findByDate(
    @CurrentUser() user: any,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.appointmentsService.findByDate(salonId, date);
  }

  @Get('search')
  search(
    @CurrentUser() user: any,
    @Query('q') query?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.appointmentsService.search(salonId, query, date, status);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(body, user.salonId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, body.status, user.salonId);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.delete(id, user.salonId);
  }
}