import { ReportController } from './report.controller';

describe('ReportController getReportSignedUrl authorization', () => {
  const options = { metabase: { resource: { dashboard: 1 } }, canViewSelfDataOnly: true, canViewGroupDataOnly: true };
  let reportService: {
    getReportById: jest.Mock;
    getReportPermissionGroupIds: jest.Mock;
    prepareMetabaseUrl: jest.Mock;
  };
  let entityManager: { query: jest.Mock };
  let controller: ReportController;

  beforeEach(() => {
    reportService = {
      getReportById: jest
        .fn()
        .mockResolvedValue({ id: 'report1', appId: 'appA', type: 'metabase', options, title: 'Sales' }),
      getReportPermissionGroupIds: jest.fn().mockResolvedValue([]),
      prepareMetabaseUrl: jest.fn().mockReturnValue('https://mb.example/embed/dashboard/token'),
    };
    entityManager = { query: jest.fn().mockResolvedValue([{ permission_group_id: 'groupStaff' }]) };
    controller = new ReportController(reportService as any, entityManager as any);
  });

  const member = (overrides: Record<string, any>) =>
    ({ appId: 'appA', memberId: 'm1', role: 'general-member', permissions: [], ...overrides } as any);

  it('refuses a report of another app as not found, even for that caller app owner', async () => {
    await expect(
      controller.getReportSignedUrl(member({ appId: 'appB', role: 'app-owner' }), 'report1'),
    ).rejects.toMatchObject({ code: 'E_DB_GET_REPORT_NOT_FOUND' });
    expect(reportService.prepareMetabaseUrl).not.toHaveBeenCalled();
  });

  it('refuses a same-app general member without report permissions', async () => {
    await expect(controller.getReportSignedUrl(member({}), 'report1')).rejects.toMatchObject({
      code: 'E_REPORT_FORBIDDEN',
    });
    expect(reportService.prepareMetabaseUrl).not.toHaveBeenCalled();
  });

  it.each(['REPORT_VIEW', 'REPORT_ADMIN'])('allows a general-member staff with %s', async permission => {
    const result = await controller.getReportSignedUrl(member({ permissions: [permission] }), 'report1');
    expect(result).toEqual({ code: 'SUCCESS', message: 'get url success', result: expect.any(String) });
  });

  it('allows the app owner without report permissions', async () => {
    const result = await controller.getReportSignedUrl(member({ role: 'app-owner' }), 'report1');
    expect(result.code).toBe('SUCCESS');
  });

  it('keeps passing self/group data parameters to the metabase url builder', async () => {
    await controller.getReportSignedUrl(member({ permissions: ['REPORT_VIEW'] }), 'report1');
    expect(reportService.prepareMetabaseUrl).toHaveBeenCalledWith('appA', 'm1', 'general-member', options, [
      'groupStaff',
    ]);
  });

  describe('report limited to permission groups', () => {
    beforeEach(() => reportService.getReportPermissionGroupIds.mockResolvedValue(['groupFinance']));

    it('refuses REPORT_VIEW staff outside the groups', async () => {
      await expect(
        controller.getReportSignedUrl(member({ permissions: ['REPORT_VIEW'] }), 'report1'),
      ).rejects.toMatchObject({ code: 'E_REPORT_FORBIDDEN' });
    });

    it('allows REPORT_VIEW staff inside one of the groups', async () => {
      entityManager.query.mockResolvedValue([{ permission_group_id: 'groupFinance' }]);
      const result = await controller.getReportSignedUrl(member({ permissions: ['REPORT_VIEW'] }), 'report1');
      expect(result.code).toBe('SUCCESS');
    });

    it('lets REPORT_ADMIN and the app owner bypass the groups', async () => {
      expect((await controller.getReportSignedUrl(member({ permissions: ['REPORT_ADMIN'] }), 'report1')).code).toBe(
        'SUCCESS',
      );
      expect((await controller.getReportSignedUrl(member({ role: 'app-owner' }), 'report1')).code).toBe('SUCCESS');
    });

    it('fails closed when the group lookup fails', async () => {
      reportService.getReportPermissionGroupIds.mockRejectedValue(new Error('db down'));
      await expect(controller.getReportSignedUrl(member({ permissions: ['REPORT_VIEW'] }), 'report1')).rejects.toThrow(
        'db down',
      );
      expect(reportService.prepareMetabaseUrl).not.toHaveBeenCalled();
    });
  });
});
