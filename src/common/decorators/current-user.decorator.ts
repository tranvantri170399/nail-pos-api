import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current authenticated user (or a specific property) from the request.
 *
 * Usage:
 *   @CurrentUser() user          → full user object
 *   @CurrentUser('salonId') id   → just the salonId
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
