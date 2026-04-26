import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateAppointmentServiceDto {
  @IsInt()
  @Type(() => Number)
  service_id: number;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  duration_minutes: number;
}

export class CreateAppointmentDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  salon_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customer_id?: number;

  @IsInt()
  @Type(() => Number)
  staff_id: number;

  @IsString()
  @MinLength(8)
  scheduled_date: string;

  @IsString()
  @MinLength(4)
  start_time: string;

  @IsString()
  @MinLength(4)
  end_time: string;

  @IsInt()
  @Type(() => Number)
  total_minutes: number;

  @IsNumber()
  @Type(() => Number)
  total_price: number;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAppointmentServiceDto)
  appointment_services?: CreateAppointmentServiceDto[];
}
