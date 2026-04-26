import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsInt()
  @Type(() => Number)
  salonId: number;

  @IsInt()
  @Type(() => Number)
  categoryId: number;

  @IsString()
  @MinLength(2)
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
