import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  @Post('login')
  login(@Body() body: { phone: string; pin: string }) {
    return this.authService.login(body.phone, body.pin);
  }

  // POST /auth/set-pin/:staffId
  @Post('set-pin/:staffId')
  setPin(
    @Param('staffId') staffId: string,
    @Body() body: { pin: string },  // ← Sửa chỗ này
  ) {
    return this.authService.setPin(+staffId, body.pin);
  }
}