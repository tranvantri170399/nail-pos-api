// src/time-clocks/dto/create-time-clock.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';

export class CreateTimeClockDto {
  @IsNotEmpty()
  @IsNumber()
  staff_id: number;

  @IsOptional()
  clock_in?: Date;

  @IsOptional()
  clock_out?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTimeClockDto {
  @IsOptional()
  clock_out?: Date;

  @IsOptional()
  @IsEnum(['active', 'completed'])
  status?: 'active' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;
}
