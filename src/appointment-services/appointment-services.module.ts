import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment-service.entity';
import { AppointmentServicesController } from './appointment-services.controller';
import { AppointmentServicesService } from './appointment-services.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentService])],
  controllers: [AppointmentServicesController],
  providers: [AppointmentServicesService],
  exports: [AppointmentServicesService],
})
export class AppointmentServicesModule {}
