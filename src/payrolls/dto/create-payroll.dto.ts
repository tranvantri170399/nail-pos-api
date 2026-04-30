// src/payrolls/dto/create-payroll.dto.ts
import { IsNotEmpty, IsDateString, IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';

export class CreatePayrollDto {
  @IsNumber()
  @IsNotEmpty()
  staff_id: number;

  @IsNumber()
  commission_amount: number;

  @IsNumber()
  tip_amount: number;

  @IsDateString()
  period_start: string;

  @IsDateString()
  period_end: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePayrollDto {
  @IsOptional()
  @IsEnum(['pending', 'paid', 'cancelled'])
  status?: 'pending' | 'paid' | 'cancelled';

  @IsOptional()
  @IsString()
  notes?: string;
}
