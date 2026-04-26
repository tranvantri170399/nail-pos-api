import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginStaffDto } from './dto/login-staff.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/staff/login
  @Post('staff/login')
  loginStaff(@Body() body: LoginStaffDto) {
    return this.authService.loginStaff(body.phone, body.pin);
  }

  // POST /auth/owner/login
  @Post('owner/login')
  loginOwner(@Body() body: LoginOwnerDto) {
    return this.authService.loginOwner(body.phone, body.password);
  }

  // POST /auth/staff/set-pin/:staffId
  @Post('staff/set-pin/:staffId')
  setPin(
    @Param('staffId') staffId: string,
    @Body() body: SetPinDto,
  ) {
    return this.authService.setPin(+staffId, body.pin);
  }

  // POST /auth/owner/set-password/:ownerId
  @Post('owner/set-password/:ownerId')
  setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() body: SetOwnerPasswordDto,
  ) {
    return this.authService.setOwnerPassword(+ownerId, body.password);
  }
}