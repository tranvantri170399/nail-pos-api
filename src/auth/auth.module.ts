import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { Staff } from '../staffs/staff.entity';
import { Owner } from '../owners/owner.entity';  // ← Thêm
import { Salon } from '../salons/salon.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'nail-pos-secret',
      signOptions: { expiresIn: '7d' },
    }),
    TypeOrmModule.forFeature([Staff, Owner, Salon]),  // ← Thêm Owner
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}