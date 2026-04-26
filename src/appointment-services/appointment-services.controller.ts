import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AppointmentServicesService } from './appointment-services.service';

@UseGuards(JwtAuthGuard)
@Controller('appointment-services')
export class AppointmentServicesController {
  constructor(private readonly appointmentServicesService: AppointmentServicesService) {}

  @Get('appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.appointmentServicesService.findByAppointment(+appointmentId);
  }

  @Post()
  addToAppointment(@Body() body: { 
    appointmentId: number; 
    serviceId: number; 
    price: number; 
    durationMinutes: number;
  }) {
    return this.appointmentServicesService.addToAppointment(
      body.appointmentId,
      body.serviceId,
      body.price,
      body.durationMinutes,
    );
  }

  @Patch(':id')
  updateAppointmentService(
    @Param('id') id: string,
    @Body() body: { price: number; durationMinutes: number }
  ) {
    return this.appointmentServicesService.updateAppointmentService(
      +id,
      body.price,
      body.durationMinutes,
    );
  }

  @Delete(':id')
  removeFromAppointment(@Param('id') id: string) {
    return this.appointmentServicesService.removeFromAppointment(+id);
  }

  @Get('appointment/:appointmentId/totals')
  calculateAppointmentTotals(@Param('appointmentId') appointmentId: string) {
    return this.appointmentServicesService.calculateAppointmentTotals(+appointmentId);
  }
}
