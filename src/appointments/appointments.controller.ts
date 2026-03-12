import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

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
  create(@Body() body: any) {
    return this.appointmentsService.create(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.appointmentsService.updateStatus(+id, status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.appointmentsService.delete(+id);
  }
}