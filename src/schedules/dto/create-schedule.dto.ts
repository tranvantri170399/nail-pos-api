// src/schedules/dto/create-schedule.dto.ts
import { IsNotEmpty, IsDateString, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  @IsNotEmpty()
  staff_id: number;

  @IsDateString()
  schedule_date: string;

  @IsNotEmpty()
  @IsString()
  start_time: string;

  @IsNotEmpty()
  @IsString()
  end_time: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsDateString()
  schedule_date?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsEnum(['active', 'cancelled', 'completed'])
  status?: 'active' | 'cancelled' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;
}
