// notifications/notifications.controller.ts
import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('customer/:id')
  getCustomerNotifications(@Param('id', ParseIntPipe) customerId: number) {
    return this.notificationsService.getCustomerNotifications(customerId);
  }

  @Get('salon')
  getSalonNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getSalonNotifications(user.salonId);
  }
}
