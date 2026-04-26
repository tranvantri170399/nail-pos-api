import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateTransactionItemDto {
  @IsInt()
  @Type(() => Number)
  service_id: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  staff_id?: number;

  @IsString()
  @MinLength(2)
  service_name: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Type(() => Number)
  commission_rate: number;
}

export class CreateTransactionDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  appointment_id?: number;

  @IsInt()
  @Type(() => Number)
  salon_id: number;

  @IsNumber()
  @Type(() => Number)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tip_amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tax_amount?: number;

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items?: CreateTransactionItemDto[];
}
