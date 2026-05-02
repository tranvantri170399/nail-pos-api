import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../staffs/staff.entity';
import { Owner } from '../owners/owner.entity';
import * as bcrypt from 'bcryptjs';
import { Salon } from '../salons/salon.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,

    @InjectRepository(Owner)          // ← Thêm
    private ownerRepo: Repository<Owner>,

    @InjectRepository(Salon)
    private salonRepo: Repository<Salon>,

    private jwtService: JwtService,
  ) {}

  // ── LOGIN NHÂN VIÊN (phone + PIN 4 số) ──────────────────
  async loginStaff(phone: string, pin: string) {
    try {
      const staff = await this.staffRepo.findOne({ where: { phone } });
      if (!staff) throw new UnauthorizedException('Số điện thoại không tồn tại');
      if (!staff.isActive) throw new UnauthorizedException('Tài khoản đã bị khoá');
      const isMatch = await bcrypt.compare(pin, staff.pinCode); // ✅ pinCode
      if (!isMatch) throw new UnauthorizedException('PIN không đúng');

      const payload = {
        sub: staff.id,
        id: staff.id,
        name: staff.name,
        role: staff.role,
        type: 'staff',
        salonId: staff.salonId,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: staff.id,
          salon_id: staff.salonId, // ✅ thêm salon_id
          name: staff.name,
          role: staff.role,
          color: staff.color,
          type: 'staff',
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error in loginStaff:', error);
      throw new UnauthorizedException('Đăng nhập thất bại');
    }
  }

  // ── LOGIN CHỦ TIỆM (phone + password) ───────────────────
  async loginOwner(phone: string, password: string) {
    try {
      const owner = await this.ownerRepo.findOne({ where: { phone } });
      if (!owner) throw new UnauthorizedException('Số điện thoại không tồn tại');
      
      if (!owner.is_active) throw new UnauthorizedException('Tài khoản đã bị khoá'); // ✅ isActive

      const isMatch = await bcrypt.compare(password, owner.password);
      if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng');
      // 🔹 Lấy salon của owner
      const salon = await this.salonRepo.findOne({ where: { ownerId: owner.id },});

      const payload = {
        sub: owner.id,
        id: owner.id,
        name: owner.name,
        role: 'owner',
        type: 'owner',       // ← Phân biệt loại user
        salonId: salon?.id, // thêm để client lấy salon id
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: owner.id,
          name: owner.name,
          salon_name: owner.salon_name,
          role: 'owner',
          type: 'owner',
          salonId: salon?.id,
          salonName: salon?.name,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error in loginOwner:', error);
      throw new UnauthorizedException('Đăng nhập thất bại');
    }
  }

  // ── SET PASSWORD CHO OWNER ───────────────────────────────
  async setOwnerPassword(ownerId: number, password: string) {
    try {
      const hashed = await bcrypt.hash(password, 10);
      await this.ownerRepo.update(ownerId, { password: hashed });
      return { message: 'Mật khẩu đã được cập nhật' };
    } catch (error) {
      this.logger.error('Error in setOwnerPassword:', error);
      throw error;
    }
  }

  // ── SET PIN CHO STAFF ────────────────────────────────────
  async setPin(staffId: number, pin: string) {
    try {
      const hashed = await bcrypt.hash(pin, 10);
      await this.staffRepo.update(staffId, { pinCode: hashed });
      return { message: 'PIN đã được cập nhật' };
    } catch (error) {
      this.logger.error('Error in setPin:', error);
      throw error;
    }
  }
}