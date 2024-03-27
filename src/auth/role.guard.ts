import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLE_KEY } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { AccessControlService } from './access-control.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControlService: AccessControlService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log("@$G$GF@EQWFDWQ")
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; 
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const member = request.locals?.member;

    if (!member) {
      throw new UnauthorizedException('none member found');
    }

    const hasAccess = this.accessControlService.isAuthorized({
      currentRoles: member.roles,
      requiredRoles,
    });

    if (!hasAccess) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
