import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceCategoryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  salonId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
