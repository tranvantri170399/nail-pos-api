import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      if (info) {
        this.logger.warn(`JWT authentication failed: ${info.message}`);
      }
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}