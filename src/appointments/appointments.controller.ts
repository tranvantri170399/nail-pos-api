import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('appointments')
export class AppointmentsController {

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all appointments for a salon' })
  @ApiResponse({ status: 200, description: 'Returns paginated appointments' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.appointmentsService.findBySalon(salonId, pagination);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get appointments by date' })
  @ApiResponse({ status: 200, description: 'Returns appointments for the specified date' })
  findByDate(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.appointmentsService.findByDate(salonId, date);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search appointments' })
  @ApiResponse({ status: 200, description: 'Returns search results' })
  search(
    @CurrentUser() user: JwtPayload,
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
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(body, user.salonId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, body.status, user.salonId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  delete(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.delete(id, user.salonId);
  }
}