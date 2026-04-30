// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from '../staffs/staff.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Staff])],
  controllers: [HealthController],
})
export class HealthModule {}
