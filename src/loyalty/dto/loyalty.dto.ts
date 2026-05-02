// loyalty/dto/loyalty.dto.ts
export class RedeemPointsDto {
  customer_id: number;
  points: number;
  reason?: string;
}

export class AdjustPointsDto {
  customer_id: number;
  points: number; // positive to add, negative to subtract
  reason: string;
}

export class LoyaltyConfigDto {
  points_per_vnd: number; // Points earned per 1 VND spent
  points_tiers: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  points_expiry_months: number;
}
