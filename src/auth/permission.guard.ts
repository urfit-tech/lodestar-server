import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PERMISSION_KEY } from '../decorators/permissions.decorator';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { AccessControlService } from './access-control.service';
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControlService: AccessControlService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    // Get required roles for the current route handler or controller class.
    // If roles are defined on the handler, they override those on the controller.
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionSet[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; 
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const member = response.locals?.member;

    if (!member) {
      throw new UnauthorizedException('No member found for the current token');
    }

    const hasAccess = this.accessControlService.isAuthorized({
      currentPermissions: member.permissions,
      requiredPermissions,
    });

    if (!hasAccess) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
