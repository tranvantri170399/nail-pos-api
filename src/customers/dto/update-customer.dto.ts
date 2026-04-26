import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCustomerDto {
  @IsOptional()
  @Type(() => Number)
  salonId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
