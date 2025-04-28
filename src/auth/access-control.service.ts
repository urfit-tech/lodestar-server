import { Injectable } from '@nestjs/common';
import { PermissionSet } from '~/enums/PermissionSet.enum';

interface IsAuthorizedParams {
  currentPermissions: PermissionSet[];
  requiredPermissions: PermissionSet[];
}

@Injectable()
export class AccessControlService {
  constructor() {}

  public isAuthorized({ currentPermissions, requiredPermissions }: IsAuthorizedParams) {
    return currentPermissions.some(permissions => requiredPermissions.includes(permissions));
  }
}
