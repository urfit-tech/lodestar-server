import { AppCache } from '~/app/app.type';

type FakeApp = { id: string; hosts: string[]; settings?: Record<string, string> };

// Apps and hosts used by the origin trust tests (tests only).
export const FAKE_APPS: FakeApp[] = [
  { id: 'taotaoxi', hosts: ['course.taotaoxi.net', 'www.taotaoxi.net'] },
  { id: 'ming-guang', hosts: ['www.ming-guang.com', 'estimators.ming-guang.com'] },
  { id: 'commonhealth', hosts: ['course.commonhealth.com.tw', 'www.commonhealth.com.tw'] },
  { id: 'tenant-a', hosts: ['a.kolable.app', 'www.tenant-a-site.com'] },
  {
    id: 'tenant-b',
    hosts: ['b.kolable.app', 'console.tenant-b-site.com'],
    settings: { cors_allowed_domains: JSON.stringify(['console.tenant-b-site.com', 'partner.example.org']) },
  },
  {
    // lists hosts in its own setting; that grants nothing on other apps' hosts
    id: 'tenant-c',
    hosts: ['c.kolable.app', 'www.tenant-c-site.com'],
    settings: { cors_allowed_domains: JSON.stringify(['www.tenant-c-site.com', 'c.kolable.app']) },
  },
  { id: 'api', hosts: ['api.kolable.com'] },
];

export const createFakeAppLookup = (apps: FakeApp[] = FAKE_APPS) => ({
  getAppInfoByHost: jest.fn(async (host: string) => {
    const app = apps.find(({ hosts }) => hosts.includes(host));
    if (!app) {
      throw new Error('no app in this host');
    }
    return { id: app.id, host: app.hosts[0], settings: app.settings || {} } as unknown as AppCache;
  }),
  getAppHostNames: jest.fn(async (appId: string) => {
    const app = apps.find(({ id }) => id === appId);
    if (!app) {
      throw new Error('no app');
    }
    return app.hosts;
  }),
});

export type FakeAppLookup = ReturnType<typeof createFakeAppLookup>;
