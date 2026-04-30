// src/waiting-list/dto/create-waiting-list.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateWaitingListDto {
  @IsNotEmpty()
  @IsString()
  customer_name: string;

  @IsNotEmpty()
  @IsString()
  customer_phone: string;

  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsNumber()
  staff_id?: number;

  @IsOptional()
  @IsNumber()
  party_size?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWaitingListDto {
  @IsOptional()
  @IsNumber()
  staff_id?: number;

  @IsOptional()
  @IsEnum(['waiting', 'serving', 'completed', 'cancelled'])
  status?: 'waiting' | 'serving' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  notes?: string;
}
