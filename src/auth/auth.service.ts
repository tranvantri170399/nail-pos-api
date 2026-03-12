import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../staffs/staff.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    private jwtService: JwtService,
  ) {}

  // Login bằng phone + pin_code
  async login(phone: string, pin: string) {
    const staff = await this.staffRepo.findOne({ where: { phone } });

    if (!staff) throw new UnauthorizedException('Số điện thoại không tồn tại');
    if (!staff.is_active) throw new UnauthorizedException('Tài khoản đã bị khoá');

    // So sánh PIN (bcrypt)
    const isMatch = await bcrypt.compare(pin, staff.pin_code);
    if (!isMatch) throw new UnauthorizedException('PIN không đúng');

    // Tạo JWT token
    const payload = { sub: staff.id, name: staff.name, role: staff.role };
    return {
      access_token: this.jwtService.sign(payload),
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        color: staff.color,
      },
    };
  }

  // Set PIN lần đầu (hoặc đổi PIN)
  async setPin(staffId: number, newPin: string) {
    const hashed = await bcrypt.hash(newPin, 10);
    await this.staffRepo.update(staffId, { pin_code: hashed });
    return { message: 'PIN đã được cập nhật' };
  }

  // Verify token (dùng cho guard)
  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}