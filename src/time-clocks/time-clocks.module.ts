// src/time-clocks/time-clocks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeClocksService } from './time-clocks.service';
import { TimeClocksController } from './time-clocks.controller';
import { TimeClock } from './time-clock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeClock])],
  controllers: [TimeClocksController],
  providers: [TimeClocksService],
  exports: [TimeClocksService],
})
export class TimeClocksModule {}
