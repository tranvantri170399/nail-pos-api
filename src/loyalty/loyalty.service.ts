// loyalty/loyalty.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyTransaction } from './loyalty.entity';
import { Customer } from '../customers/customer.entity';
import { RedeemPointsDto, AdjustPointsDto, LoyaltyConfigDto } from './dto/loyalty.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyTransaction)
    private loyaltyRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  // Default loyalty configuration
  private config: LoyaltyConfigDto = {
    points_per_vnd: 0.01, // 1 point per 100 VND
    points_tiers: {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      platinum: 10000,
    },
    points_expiry_months: 12,
  };

  /**
   * Earn points from a transaction
   */
  async earnPoints(
    customerId: number,
    salonId: number,
    transactionId: number,
    amount: number,
  ): Promise<void> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) return;

    // Calculate points earned
    const pointsEarned = Math.floor(amount * this.config.points_per_vnd);
    if (pointsEarned <= 0) return;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + this.config.points_expiry_months);

    // Create loyalty transaction
    const loyaltyTransaction = this.loyaltyRepo.create({
      customerId,
      salonId,
      transactionId,
      type: 'earned',
      points: pointsEarned,
      balance: (customer.loyaltyPoints || 0) + pointsEarned,
      reason: `Points earned from transaction`,
      expiresAt,
    });
    await this.loyaltyRepo.save(loyaltyTransaction);

    // Update customer points and tier
    customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
    customer.loyaltyTier = this.calculateTier(customer.loyaltyPoints);
    await this.customerRepo.save(customer);
  }

  /**
   * Redeem points
   */
  async redeemPoints(dto: RedeemPointsDto, salonId: number): Promise<LoyaltyTransaction> {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customer_id } });
    if (!customer) throw new NotFoundException('Customer not found');

    if ((customer.loyaltyPoints || 0) < dto.points) {
      throw new BadRequestException('Insufficient points');
    }

    // Create loyalty transaction
    const loyaltyTransaction = this.loyaltyRepo.create({
      customerId: dto.customer_id,
      salonId,
      type: 'redeemed',
      points: -dto.points,
      balance: customer.loyaltyPoints - dto.points,
      reason: dto.reason || 'Points redeemed',
    });
    await this.loyaltyRepo.save(loyaltyTransaction);

    // Update customer points and tier
    customer.loyaltyPoints -= dto.points;
    customer.loyaltyTier = this.calculateTier(customer.loyaltyPoints);
    await this.customerRepo.save(customer);

    return loyaltyTransaction;
  }

  /**
   * Manually adjust points (for admin)
   */
  async adjustPoints(dto: AdjustPointsDto, salonId: number): Promise<LoyaltyTransaction> {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customer_id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const newBalance = (customer.loyaltyPoints || 0) + dto.points;
    if (newBalance < 0) {
      throw new BadRequestException('Cannot reduce points below zero');
    }

    // Create loyalty transaction
    const loyaltyTransaction = this.loyaltyRepo.create({
      customerId: dto.customer_id,
      salonId,
      type: 'adjusted',
      points: dto.points,
      balance: newBalance,
      reason: dto.reason,
    });
    await this.loyaltyRepo.save(loyaltyTransaction);

    // Update customer points and tier
    customer.loyaltyPoints = newBalance;
    customer.loyaltyTier = this.calculateTier(newBalance);
    await this.customerRepo.save(customer);

    return loyaltyTransaction;
  }

  /**
   * Get customer loyalty history
   */
  async getCustomerHistory(
    customerId: number,
    salonId: number,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<LoyaltyTransaction>> {
    return paginateRepository(this.loyaltyRepo, pagination, {
      where: { customerId, salonId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get customer loyalty summary
   */
  async getCustomerSummary(customerId: number): Promise<any> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    // Calculate next tier
    const nextTier = this.getNextTier(customer.loyaltyPoints || 0);
    const pointsToNext = nextTier ? nextTier.threshold - (customer.loyaltyPoints || 0) : 0;

    return {
      customerId: customer.id,
      name: customer.name,
      loyaltyPoints: customer.loyaltyPoints || 0,
      loyaltyTier: customer.loyaltyTier || 'bronze',
      nextTier: nextTier?.name || null,
      pointsToNext,
      totalVisits: customer.total_visits,
      totalSpent: customer.total_spent,
    };
  }

  /**
   * Calculate loyalty tier based on points
   */
  private calculateTier(points: number): string {
    if (points >= this.config.points_tiers.platinum) return 'platinum';
    if (points >= this.config.points_tiers.gold) return 'gold';
    if (points >= this.config.points_tiers.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Get next tier info
   */
  private getNextTier(points: number): { name: string; threshold: number } | null {
    const tiers = [
      { name: 'silver', threshold: this.config.points_tiers.silver },
      { name: 'gold', threshold: this.config.points_tiers.gold },
      { name: 'platinum', threshold: this.config.points_tiers.platinum },
    ];

    for (const tier of tiers) {
      if (points < tier.threshold) {
        return tier;
      }
    }
    return null;
  }

  /**
   * Update loyalty configuration
   */
  updateConfig(config: Partial<LoyaltyConfigDto>): LoyaltyConfigDto {
    this.config = { ...this.config, ...config };
    return this.config;
  }

  /**
   * Get current configuration
   */
  getConfig(): LoyaltyConfigDto {
    return this.config;
  }
}
