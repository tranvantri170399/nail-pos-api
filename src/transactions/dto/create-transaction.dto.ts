import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// ── Payment DTO (for split payment) ────────────
export class CreateTransactionPaymentDto {
  @IsString()
  payment_method: string; // 'cash' | 'card' | 'transfer' | 'gift_card' | 'other'

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string; // card last 4, transfer ID, etc.
}

// ── Item DTO ───────────────────────────────────
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

  // ── Item-level discount ───────────────────────
  @IsOptional()
  @IsString()
  discount_type?: string; // 'percentage' | 'fixed'

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount_value?: number;

  @IsOptional()
  @IsString()
  discount_reason?: string;

  // ── Item-level tip ────────────────────────────
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tip_amount?: number;
}

// ── Transaction DTO ────────────────────────────
export class CreateTransactionDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  appointment_id?: number;

  @IsInt()
  @Type(() => Number)
  salon_id: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customer_id?: number;

  @IsNumber()
  @Type(() => Number)
  subtotal: number;

  // ── Transaction-level discount ────────────────
  @IsOptional()
  @IsString()
  discount_type?: string; // 'percentage' | 'fixed'

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount_value?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount_amount?: number;

  @IsOptional()
  @IsString()
  discount_reason?: string;

  // ── Tip (can be total or per-item) ────────────
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tip_amount?: number;

  // ── Tax (backend auto-calculates, but client can send for display) ─
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tax_amount?: number;

  // ── Payment ───────────────────────────────────
  @IsString()
  payment_method: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionPaymentDto)
  payments?: CreateTransactionPaymentDto[];

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
