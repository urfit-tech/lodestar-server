import { Injectable } from '@nestjs/common';
import { Role } from '~/enums/role.enum';

interface IsAuthorizedParams {
  currentRoles: Role[];
  requiredRoles: Role[];
}

@Injectable()
export class AccessControlService {
  constructor() {}

  public isAuthorized({ currentRoles, requiredRoles }: IsAuthorizedParams) {
    console.log("E$@EF@F@")
    return currentRoles.some(role => requiredRoles.includes(role));
  }
}
