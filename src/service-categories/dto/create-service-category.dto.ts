import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsInt()
  @Type(() => Number)
  salonId: number;

  @IsString()
  @MinLength(2)
  name: string;

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
