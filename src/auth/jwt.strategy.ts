import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'nail-pos-secret',
    });
  }

  validate(payload: any) {
    return {
      id: payload.sub,
      name: payload.name,
      role: payload.role,
      type: payload.type,
      salonId: payload.salonId,
    };
  }
}