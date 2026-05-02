import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginStaffDto } from './dto/login-staff.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/staff/login
  @Post('staff/login')
  @ApiOperation({ summary: 'Login staff with phone and PIN' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  loginStaff(@Body() body: LoginStaffDto) {
    return this.authService.loginStaff(body.phone, body.pin);
  }

  // POST /auth/owner/login
  @Post('owner/login')
  @ApiOperation({ summary: 'Login owner with phone and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  loginOwner(@Body() body: LoginOwnerDto) {
    return this.authService.loginOwner(body.phone, body.password);
  }

  // POST /auth/staff/set-pin/:staffId
  @Post('staff/set-pin/:staffId')
  @ApiOperation({ summary: 'Set staff PIN' })
  @ApiResponse({ status: 200, description: 'PIN updated successfully' })
  setPin(
    @Param('staffId') staffId: string,
    @Body() body: SetPinDto,
  ) {
    return this.authService.setPin(+staffId, body.pin);
  }

  // POST /auth/owner/set-password/:ownerId
  @Post('owner/set-password/:ownerId')
  @ApiOperation({ summary: 'Set owner password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() body: SetOwnerPasswordDto,
  ) {
    return this.authService.setOwnerPassword(+ownerId, body.password);
  }
}