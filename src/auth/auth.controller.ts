import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginStaffDto } from './dto/login-staff.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto';
import { JwtAuthGuard } from './jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/staff/login
  @Post('staff/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Login staff with phone and PIN' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginStaff(@Body() dto: LoginStaffDto) {
    return this.authService.loginStaff(dto.phone, dto.pin);
  }

  // POST /auth/owner/login
  @Post('owner/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
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

  // POST /auth/owner/set-password
  @Post('owner/set-password/:ownerId')
  @ApiOperation({ summary: 'Set owner password' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  async setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() dto: SetOwnerPasswordDto,
  ) {
    return this.authService.setOwnerPassword(+ownerId, dto.password);
  }

  // POST /auth/logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout() {
    // Since JWT is stateless, the client should just delete the token
    // This endpoint can be used for server-side cleanup if needed
    return { message: 'Logged out successfully' };
  }
}