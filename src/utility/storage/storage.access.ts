import { APIException } from '~/api.excetion';
import { JwtMember } from '~/auth/auth.dto';
import { isAppOwnerOrHasAnyPermission } from '~/auth/authorization.helper';
import { PermissionSet } from '~/enums/PermissionSet.enum';

// Who may read or write keys under a restricted top-level prefix (besides the app owner).
// export/<appId>/...: files written by ExporterTasker for POST /members/export and /orders/export*.
// import/<appId>/...: files read by ImporterTasker for POST /members/import and /coins/import.
export const RESTRICTED_STORAGE_PREFIX_PERMISSIONS: Readonly<Record<string, ReadonlyArray<string>>> = {
  export: [
    // MEMBER_DOWNLOAD_PERMISSION_GROUP (member.controller.ts POST export)
    PermissionSet.MEMBER_ADMIN,
    PermissionSet.MEMBER_CREATE,
    PermissionSet.SALES_LEAD_ADMIN,
    PermissionSet.SALES_LEAD_NORMAL,
    PermissionSet.SALES_PERFORMANCE_ADMIN,
    // ORDER_PERMISSION_GROUP_ADMIN (order.controller.ts POST export*)
    PermissionSet.SALES_RECORDS_NORMAL,
    PermissionSet.SALES_RECORDS_ADMIN,
  ],
  import: [
    // MEMBER_PERMISSION_GROUP_ADMIN (member.controller.ts / coin.controller.ts POST import)
    PermissionSet.MEMBER_ADMIN,
    PermissionSet.POST_ADMIN,
    PermissionSet.SALES_RECORDS_NORMAL,
    PermissionSet.SALES_RECORDS_ADMIN,
    PermissionSet.PROGRAM_ADMIN,
    PermissionSet.PROGRAM_PACKAGE_TEMPO_DELIVERY_ADMIN,
    PermissionSet.APPOINTMENT_PLAN_ADMIN,
    PermissionSet.COIN_ADMIN,
    PermissionSet.SALES_LEAD_SELECTOR_ADMIN,
    PermissionSet.SHIPPING_ADMIN,
    PermissionSet.SHIPPING_NORMAL,
    PermissionSet.MEMBER_PHONE_ADMIN,
    PermissionSet.PROJECT_PORTFOLIO_ADMIN,
    PermissionSet.SALES_PERFORMANCE_ADMIN,
    PermissionSet.SALES_LEAD_ADMIN,
    PermissionSet.SALES_LEAD_NORMAL,
    PermissionSet.MATERIAL_AUDIT_LOG_ADMIN,
  ],
};

const isRelativeSegment = (segment: string) => segment === '.' || segment === '..';

const forbidden = (message: string) => new APIException({ code: 'E_STORAGE_KEY_FORBIDDEN', message }, 403);

export const canUseStoragePrefix = (prefix: string, member: JwtMember | undefined): boolean => {
  const required = Object.prototype.hasOwnProperty.call(RESTRICTED_STORAGE_PREFIX_PERMISSIONS, prefix)
    ? RESTRICTED_STORAGE_PREFIX_PERMISSIONS[prefix]
    : undefined;
  return !required || isAppOwnerOrHasAnyPermission(member, required);
};

/**
 * True when `key` has the layout `<prefix>/<appId>/<rest>` for the given app, as the admin uploader builds it
 * (`vod/<appId>/<id[0..2]>/<id>/video/<file>`), with no `.` / `..` segments.
 */
export const isStorageKeyInApp = (key: unknown, appId: string | undefined): boolean => {
  if (typeof key !== 'string' || !appId) {
    return false;
  }
  const segments = key.split('/');
  if (segments.length < 3 || segments.some(isRelativeSegment)) {
    return false;
  }
  const [prefix, keyAppId, ...rest] = segments;
  return prefix !== '' && keyAppId === appId && rest.join('/') !== '';
};

// For the multipart endpoints, which receive the full key.
export const assertStorageKeyInApp = (key: unknown, member: JwtMember | undefined): void => {
  if (!isStorageKeyInApp(key, member?.appId)) {
    throw forbidden('storage key must be under <prefix>/<your appId>/');
  }
  const prefix = (key as string).split('/')[0];
  if (!canUseStoragePrefix(prefix, member)) {
    throw forbidden(`no permission to access ${prefix} files`);
  }
};

/**
 * For POST storage/storage/upload|download, whose key is `<prefix>/<token appId>/<fileName>`.
 * The prefix must be one path segment (so the key stays under the caller's app) and export/import need the
 * matching admin permission.
 */
export const assertStoragePrefixAndFileName = (
  prefix: unknown,
  fileName: unknown,
  member: JwtMember | undefined,
): void => {
  if (typeof prefix !== 'string' || prefix === '' || prefix.includes('/') || isRelativeSegment(prefix)) {
    throw forbidden('prefix must be a single path segment');
  }
  if (typeof fileName !== 'string' || fileName === '' || fileName.split('/').some(isRelativeSegment)) {
    throw forbidden('invalid fileName');
  }
  if (!canUseStoragePrefix(prefix, member)) {
    throw forbidden(`no permission to access ${prefix} files`);
  }
};
