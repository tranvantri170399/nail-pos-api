import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Guard that ensures the current user has access to the salon
 * specified in query.salonId, body.salon_id, or params.salonId.
 *
 * - Staff: can only access their own salonId (from JWT).
 * - Owner: can access any salon where salon.ownerId === user.id.
 *
 * Must be used AFTER JwtAuthGuard so that request.user is populated.
 * Uses DataSource directly to avoid per-module Salon entity registration.
 */
@Injectable()
export class SalonAccessGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract salonId from various sources
    const requestedSalonId = this.extractSalonId(request);

    // If no salonId in the request, let individual controllers handle it
    // (they will use user.salonId as default)
    if (!requestedSalonId) {
      return true;
    }

    // Staff: can only access their own salon
    if (user.type === 'staff') {
      if (user.salonId !== requestedSalonId) {
        throw new ForbiddenException('You do not have access to this salon');
      }
      return true;
    }

    // Owner: validate they own this salon
    if (user.type === 'owner') {
      const salon = await this.dataSource.query(
        `SELECT id FROM salons WHERE id = $1 AND owner_id = $2 LIMIT 1`,
        [requestedSalonId, user.id],
      );
      if (!salon || salon.length === 0) {
        throw new ForbiddenException('You do not have access to this salon');
      }
      // Attach salonId to user for convenience in controllers
      request.user.salonId = requestedSalonId;
      return true;
    }

    throw new ForbiddenException('Invalid user type');
  }

  private extractSalonId(request: any): number | null {
    // Priority: query > body > params
    const raw =
      request.query?.salonId ??
      request.body?.salon_id ??
      request.body?.salonId ??
      request.params?.salonId ??
      null;

    if (raw === null || raw === undefined) return null;
    const parsed = Number(raw);
    return isNaN(parsed) ? null : parsed;
  }
}
