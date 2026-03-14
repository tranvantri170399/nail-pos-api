// salons/salons.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from './salon.entity';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Salon])],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}
