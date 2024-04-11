import { SetMetadata } from '@nestjs/common';
import { PermissionSet } from '~/enums/PermissionSet.enum';

export const PERMISSION_KEY = 'permission_set';

export const Permissions = (...permissions: PermissionSet[]) => SetMetadata(PERMISSION_KEY, permissions);