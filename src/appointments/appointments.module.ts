import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { AppointmentService } from '../appointment-services/appointment-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AppointmentService])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
