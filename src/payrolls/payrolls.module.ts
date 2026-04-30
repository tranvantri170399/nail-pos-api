// src/payrolls/payrolls.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { Payroll } from './payroll.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll])],
  controllers: [PayrollsController],
  providers: [PayrollsService],
  exports: [PayrollsService],
})
export class PayrollsModule {}
