import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler())
      ?? Reflect.getMetadata('roles', context.getClass())
      ?? [];

    if (!requiredRoles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userRole = user?.type ?? user?.role;

    return requiredRoles.includes(userRole);
  }
}
