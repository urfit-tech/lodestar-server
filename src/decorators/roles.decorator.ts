import { SetMetadata } from '@nestjs/common';
import { PermissionSet } from 'src/enums/role.enum';

export const ROLE_KEY = 'role';

export const Permissions = (...role: PermissionSet[]) => SetMetadata(ROLE_KEY, role);