import { MemberController } from './member.controller';

describe('MemberController getSaleLeadMemberData authorization', () => {
  let getSaleLeadMemberData: jest.Mock;
  let controller: MemberController;

  beforeEach(() => {
    getSaleLeadMemberData = jest.fn().mockResolvedValue({ memberProperty: [] });
    const configService = { getOrThrow: jest.fn().mockReturnValue('secret') };
    controller = new MemberController(
      {} as any, // logger
      {} as any, // importerQueue
      {} as any, // exportQueue
      configService as any,
      { getSaleLeadMemberData } as any,
    );
  });

  const member = (overrides: Record<string, any>) =>
    ({ appId: 'appA', memberId: 'sales1', role: 'general-member', permissions: [], ...overrides } as any);

  it('uses the token app and ignores the body appId', async () => {
    await controller.getSaleLeadMemberData(member({ permissions: ['SALES_LEAD_NORMAL'] }), {
      managerId: 'sales1',
      appId: 'appB',
    });
    expect(getSaleLeadMemberData).toHaveBeenCalledWith('sales1', 'appA');
  });

  it('refuses a member without sales lead permissions', async () => {
    await expect(
      controller.getSaleLeadMemberData(member({}), { managerId: 'sales1', appId: 'appA' }),
    ).rejects.toMatchObject({ code: 'E_SALE_LEAD_FORBIDDEN' });
    expect(getSaleLeadMemberData).not.toHaveBeenCalled();
  });

  it('refuses SALES_LEAD_NORMAL reading another manager', async () => {
    await expect(
      controller.getSaleLeadMemberData(member({ permissions: ['SALES_LEAD_NORMAL'] }), { managerId: 'sales2' }),
    ).rejects.toMatchObject({ code: 'E_SALE_LEAD_FORBIDDEN' });
    expect(getSaleLeadMemberData).not.toHaveBeenCalled();
  });

  it('defaults to the caller when managerId is empty', async () => {
    await controller.getSaleLeadMemberData(member({ permissions: ['SALES_LEAD_NORMAL'] }), { managerId: '' });
    expect(getSaleLeadMemberData).toHaveBeenCalledWith('sales1', 'appA');
  });

  it('lets SALES_LEAD_ADMIN read another manager of the same app', async () => {
    await controller.getSaleLeadMemberData(member({ permissions: ['SALES_LEAD_ADMIN'] }), { managerId: 'sales2' });
    expect(getSaleLeadMemberData).toHaveBeenCalledWith('sales2', 'appA');
  });

  it('lets SALES_LEAD_NORMAL + SALES_LEAD_SELECTOR_ADMIN read another manager', async () => {
    await controller.getSaleLeadMemberData(
      member({ permissions: ['SALES_LEAD_NORMAL', 'SALES_LEAD_SELECTOR_ADMIN'] }),
      { managerId: 'sales2' },
    );
    expect(getSaleLeadMemberData).toHaveBeenCalledWith('sales2', 'appA');
  });

  it('lets the app owner read another manager', async () => {
    await controller.getSaleLeadMemberData(member({ role: 'app-owner' }), { managerId: 'sales2', appId: 'appB' });
    expect(getSaleLeadMemberData).toHaveBeenCalledWith('sales2', 'appA');
  });
});
