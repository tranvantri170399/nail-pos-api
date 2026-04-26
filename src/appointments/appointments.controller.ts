import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll() { return this.appointmentsService.findAll(); }

  @Get('by-date')
  findByDate(@Query('date') date: string) {
    return this.appointmentsService.findByDate(date);
  }

  @Post()
  create(@Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(+id, body.status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.appointmentsService.delete(+id);
  }
}