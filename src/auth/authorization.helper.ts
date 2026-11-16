import { JwtMember } from './auth.dto';

export const APP_OWNER_ROLE = 'app-owner';

type MemberLike = Pick<JwtMember, 'role' | 'permissions'> | undefined | null;

export const isAppOwner = (member: MemberLike): boolean => member?.role === APP_OWNER_ROLE;

export const hasAnyPermission = (member: MemberLike, required: ReadonlyArray<string>): boolean =>
  Array.isArray(member?.permissions) && member.permissions.some(permission => required.includes(permission));

export const isAppOwnerOrHasAnyPermission = (member: MemberLike, required: ReadonlyArray<string>): boolean =>
  isAppOwner(member) || hasAnyPermission(member, required);

/**
 * Picks the member id a request may act on.
 * The token's member id is used unless the caller asks for another member and is the app owner or holds
 * one of `staffPermissions`. Callers must still scope the query by the token's appId.
 */
export const resolveTargetMemberId = (
  member: Pick<JwtMember, 'memberId' | 'role' | 'permissions'>,
  requestedMemberId: unknown,
  staffPermissions: ReadonlyArray<string>,
): string => {
  const requested = typeof requestedMemberId === 'string' ? requestedMemberId.trim() : '';
  if (!requested || requested === member.memberId) {
    return member.memberId;
  }
  return isAppOwnerOrHasAnyPermission(member, staffPermissions) ? requested : member.memberId;
};

// Staff permissions that may read another member's equity (same app only).
// Storefront member page /members/:memberId (lodestar-app, -xuemi, -commonhealth src/pages/MemberPage/index.tsx).
export const MEMBER_PAGE_PROGRAM_STAFF_PERMISSIONS: ReadonlyArray<string> = ['CHECK_MEMBER_PAGE_PROGRAM_INFO'];
export const MEMBER_PAGE_PODCAST_STAFF_PERMISSIONS: ReadonlyArray<string> = ['CHECK_MEMBER_PAGE_PODCAST_INFO'];
export const MEMBER_PAGE_ACTIVITY_STAFF_PERMISSIONS: ReadonlyArray<string> = ['CHECK_MEMBER_PAGE_ACTIVITY_INFO'];
// Admin member page coupon tab, and the admin appointment modal that lists the chosen member's coupons
// (lodestar-app-admin, -xuemi MemberAdminPage.tsx / AppointmentPlanCollectionAdminPage.tsx).
export const MEMBER_COUPON_STAFF_PERMISSIONS: ReadonlyArray<string> = [
  'MEMBER_COUPON_PLAN_VIEW',
  'APPOINTMENT_PLAN_ADMIN',
  'APPOINTMENT_PLAN_NORMAL',
];
// Admin member page voucher tab (lodestar-app-admin, -xuemi MemberAdminPage.tsx).
export const MEMBER_VOUCHER_STAFF_PERMISSIONS: ReadonlyArray<string> = ['MEMBER_VOUCHER_PLAN_VIEW'];
