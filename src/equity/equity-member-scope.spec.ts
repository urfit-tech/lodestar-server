import { EquityController } from './equity.controller';
import { ProgramController } from '~/program/program.controller';
import { ProgramPackageController } from '~/program-package/program-package.controller';
import { PodcastController } from '~/podcast/podcast.controller';
import { PodcastPlanController } from '~/podcast/podcast-plan/podcast-plan.controller';
import { VoucherController } from '~/voucher/voucher.controller';
import { CouponController } from '~/coupon/coupon.controller';

// Every route below used ?memberId as given. A general member must only get their own data; staff with the
// permission the member pages use (and the app owner) may still pass another member's id.
describe('memberId query scoping on equity routes', () => {
  const member = (overrides: Record<string, any> = {}) =>
    ({ appId: 'appA', memberId: 'self', role: 'general-member', permissions: [], ...overrides } as any);
  const req = (query: Record<string, any>) => ({ query } as any);

  type Case = {
    name: string;
    staffPermission: string;
    call: (caller: any, memberId?: string) => Promise<any>;
    spy: () => jest.Mock;
    memberArgIndex: number;
    // The app owner branch returns every content of the program (unchanged behavior).
    appOwnerReadsAllContents?: boolean;
  };

  const programService = {
    getProgramsByMemberId: jest.fn(),
    getExpiredProgramByMemberId: jest.fn(),
    getEnrolledProgramContentsByProgramId: jest.fn(),
    getProgramContentsByProgramId: jest.fn(),
  };
  const programPackageService = {
    getProgramPackageByMemberId: jest.fn(),
    getExpiredProgramPackageByMemberId: jest.fn(),
    getEnrolledProgramPackageById: jest.fn(),
  };
  const podcastService = { getPodcastByMemberId: jest.fn() };
  const podcastPlanService = { getPodcastPlanByMemberId: jest.fn() };
  const voucherService = { getVoucherByMemberId: jest.fn() };
  const couponService = { getCouponByMemberId: jest.fn() };

  const equity = new EquityController({} as any, {} as any, programService as any);
  const program = new ProgramController({} as any, {} as any, programService as any);
  const programPackage = new ProgramPackageController(programPackageService as any);
  const podcast = new PodcastController(podcastService as any);
  const podcastPlan = new PodcastPlanController(podcastPlanService as any);
  const voucher = new VoucherController(voucherService as any);
  const coupon = new CouponController(couponService as any);

  const cases: Case[] = [
    {
      name: 'GET /equity/programs',
      staffPermission: 'CHECK_MEMBER_PAGE_PROGRAM_INFO',
      call: (caller, memberId) => equity.getProgramsByMemberId(caller, memberId),
      spy: () => programService.getProgramsByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /programs/expired',
      staffPermission: 'CHECK_MEMBER_PAGE_PROGRAM_INFO',
      call: (caller, memberId) => program.getExpiredProgramByMemberId(caller, req({ memberId })),
      spy: () => programService.getExpiredProgramByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /programs/:programId/contents',
      staffPermission: 'CHECK_MEMBER_PAGE_PROGRAM_INFO',
      call: (caller, memberId) => program.getEnrolledProgramContentsByProgramId(caller, req({ memberId }), 'program1'),
      spy: () => programService.getEnrolledProgramContentsByProgramId,
      memberArgIndex: 1,
      appOwnerReadsAllContents: true,
    },
    {
      name: 'GET /program-packages',
      staffPermission: 'CHECK_MEMBER_PAGE_PROGRAM_INFO',
      call: (caller, memberId) => programPackage.getProgramPackageByMemberId(caller, req({ memberId })),
      spy: () => programPackageService.getProgramPackageByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /program-packages/expired',
      staffPermission: 'CHECK_MEMBER_PAGE_PROGRAM_INFO',
      call: (caller, memberId) => programPackage.getExpiredProgramPackageByMemberId(caller, req({ memberId })),
      spy: () => programPackageService.getExpiredProgramPackageByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /program-packages/:programPackageId',
      staffPermission: 'CHECK_MEMBER_PAGE_PROGRAM_INFO',
      call: (caller, memberId) => programPackage.getEnrolledProgramPackageById(caller, 'package1', req({ memberId })),
      spy: () => programPackageService.getEnrolledProgramPackageById,
      memberArgIndex: 1,
    },
    {
      name: 'GET /podcasts',
      staffPermission: 'CHECK_MEMBER_PAGE_PODCAST_INFO',
      call: (caller, memberId) => podcast.getPodcastByMemberId(caller, req({ memberId })),
      spy: () => podcastService.getPodcastByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /podcast-plans',
      staffPermission: 'CHECK_MEMBER_PAGE_PODCAST_INFO',
      call: (caller, memberId) => podcastPlan.getPodcastPlanByMemberId(caller, req({ memberId })),
      spy: () => podcastPlanService.getPodcastPlanByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /vouchers',
      staffPermission: 'MEMBER_VOUCHER_PLAN_VIEW',
      call: (caller, memberId) => voucher.getVoucherByMemberId(caller, req({ memberId, includeDeleted: 'false' })),
      spy: () => voucherService.getVoucherByMemberId,
      memberArgIndex: 1,
    },
    {
      name: 'GET /coupons',
      staffPermission: 'MEMBER_COUPON_PLAN_VIEW',
      call: (caller, memberId) => coupon.getCouponByMemberId(caller, req({ memberId, includeDeleted: 'false' })),
      spy: () => couponService.getCouponByMemberId,
      memberArgIndex: 1,
    },
  ];

  beforeEach(() => jest.clearAllMocks());

  describe.each(cases)('$name', ({ staffPermission, call, spy, memberArgIndex, appOwnerReadsAllContents }) => {
    const targetOf = () => spy().mock.calls[0][memberArgIndex];
    const appOf = () => spy().mock.calls[0][0];

    it('uses the token member when no memberId is given', async () => {
      await call(member());
      expect(appOf()).toBe('appA');
      expect(targetOf()).toBe('self');
    });

    it("ignores another member's id for a general member", async () => {
      await call(member(), 'victim');
      expect(targetOf()).toBe('self');
    });

    it('ignores another member id for staff holding an unrelated permission', async () => {
      await call(member({ permissions: ['BACKSTAGE_ENTER', 'POST_ADMIN'] }), 'victim');
      expect(targetOf()).toBe('self');
    });

    it(`lets staff with ${staffPermission} read another member of the same app`, async () => {
      await call(member({ permissions: [staffPermission] }), 'victim');
      expect(appOf()).toBe('appA');
      expect(targetOf()).toBe('victim');
    });

    it('lets the app owner read another member of the same app', async () => {
      await call(member({ role: 'app-owner' }), 'victim');
      if (appOwnerReadsAllContents) {
        expect(programService.getProgramContentsByProgramId).toHaveBeenCalledWith('appA', 'program1');
        return;
      }
      expect(appOf()).toBe('appA');
      expect(targetOf()).toBe('victim');
    });
  });

  it('extra coupon staff: appointment plan staff can list the chosen member coupons', async () => {
    await coupon.getCouponByMemberId(member({ permissions: ['APPOINTMENT_PLAN_NORMAL'] }), req({ memberId: 'victim' }));
    expect(couponService.getCouponByMemberId.mock.calls[0][1]).toBe('victim');
  });

  it('PROGRAM_ADMIN still gets all program contents without a member filter', async () => {
    await program.getEnrolledProgramContentsByProgramId(
      member({ permissions: ['PROGRAM_ADMIN'] }),
      req({ memberId: 'victim' }),
      'program1',
    );
    expect(programService.getProgramContentsByProgramId).toHaveBeenCalledWith('appA', 'program1');
    expect(programService.getEnrolledProgramContentsByProgramId).not.toHaveBeenCalled();
  });
});
