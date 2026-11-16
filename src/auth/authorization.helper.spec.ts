import { hasAnyPermission, isAppOwner, resolveTargetMemberId } from './authorization.helper';

describe('authorization helper', () => {
  const member = (overrides: Record<string, any> = {}) =>
    ({ appId: 'appA', memberId: 'self', role: 'general-member', permissions: [], ...overrides } as any);

  it('detects app owners and permissions', () => {
    expect(isAppOwner(member({ role: 'app-owner' }))).toBe(true);
    expect(isAppOwner(member())).toBe(false);
    expect(isAppOwner(undefined)).toBe(false);
    expect(hasAnyPermission(member({ permissions: ['A', 'B'] }), ['B'])).toBe(true);
    expect(hasAnyPermission(member({ permissions: ['A'] }), ['B'])).toBe(false);
    expect(hasAnyPermission(member({ permissions: undefined }), ['B'])).toBe(false);
  });

  describe('resolveTargetMemberId', () => {
    it('uses the token member when nothing or the same id is requested', () => {
      expect(resolveTargetMemberId(member(), undefined, ['STAFF'])).toBe('self');
      expect(resolveTargetMemberId(member(), '', ['STAFF'])).toBe('self');
      expect(resolveTargetMemberId(member(), 'self', ['STAFF'])).toBe('self');
    });

    it('ignores another member id for a general member', () => {
      expect(resolveTargetMemberId(member(), 'victim', ['STAFF'])).toBe('self');
    });

    it('ignores non-string values such as repeated query params', () => {
      expect(resolveTargetMemberId(member({ role: 'app-owner' }), ['a', 'b'], ['STAFF'])).toBe('self');
    });

    it('allows staff and app owners to pick another member', () => {
      expect(resolveTargetMemberId(member({ permissions: ['STAFF'] }), 'victim', ['STAFF'])).toBe('victim');
      expect(resolveTargetMemberId(member({ role: 'app-owner' }), 'victim', ['STAFF'])).toBe('victim');
    });
  });
});
