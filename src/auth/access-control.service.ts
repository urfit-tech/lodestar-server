import { Injectable } from '@nestjs/common';
import { PermissionSet } from '~/enums/role.enum';

interface IsAuthorizedParams {
  currentRoles: PermissionSet[];
  requiredRoles: PermissionSet[];
}

@Injectable()
export class AccessControlService {
  constructor() {}

  public isAuthorized({ currentRoles, requiredRoles }: IsAuthorizedParams) {
    return currentRoles.some(role => requiredRoles.includes(role));
  }
}
