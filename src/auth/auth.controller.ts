import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/staff/login
  @Post('staff/login')
  loginStaff(@Body() body: { phone: string; pin: string }) {
    return this.authService.loginStaff(body.phone, body.pin);
  }

  // POST /auth/owner/login
  @Post('owner/login')
  loginOwner(@Body() body: { phone: string; password: string }) {
    return this.authService.loginOwner(body.phone, body.password);
  }

  // POST /auth/staff/set-pin/:staffId
  @Post('staff/set-pin/:staffId')
  setPin(
    @Param('staffId') staffId: string,
    @Body() body: { pin: string },
  ) {
    return this.authService.setPin(+staffId, body.pin);
  }

  // POST /auth/owner/set-password/:ownerId
  @Post('owner/set-password/:ownerId')
  setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() body: { password: string },
  ) {
    return this.authService.setOwnerPassword(+ownerId, body.password);
  }
}