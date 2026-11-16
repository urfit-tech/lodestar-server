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
