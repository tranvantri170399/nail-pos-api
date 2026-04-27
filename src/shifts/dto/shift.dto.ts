import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenShiftDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  starting_cash: number;
}

export class CloseShiftDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ending_cash: number;

  @IsOptional()
  @IsString()
  close_note?: string;
}

export class CashMovementDto {
  @IsString()
  type: string; // 'cash_in' | 'cash_out'

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
