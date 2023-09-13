import { EntityManager, Repository } from 'typeorm';
import request from 'supertest';
import { v4 } from 'uuid';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { ApplicationModule } from '~/application.module';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';
import { Report } from '~/report/entity/report.entity';

import { role, app, appPlan, appSecret, appSetting, appHost } from '../data';

describe('ReportController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let reportRepo: Repository<Report>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    appSecretRepo = manager.getRepository(AppSecret);
    appSettingRepo = manager.getRepository(AppSetting);
    memberRepo = manager.getRepository(Member);
    reportRepo = manager.getRepository(Report);

    await reportRepo.delete({});
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    await appSecretRepo.save(appSecret);
    await appSettingRepo.save(appSetting);

    await application.init();
  });

  afterEach(async () => {
    await reportRepo.delete({});
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await application.close();
  });

  describe('/report/:reportId (GET)', () => {
    const getReportRoute = `/report`;
    const authTokenRoute = '/auth/token';
    const member = new Member();
    member.id = v4();
    member.appId = app.id;
    member.email = 'test@example.com';
    member.username = 'test';
    member.role = role.name;
    member.name = 'testMember';

    const metabaseReport = new Report();
    metabaseReport.id = v4();
    metabaseReport.type = 'metabase';
    metabaseReport.title = 'test report';
    metabaseReport.app = app;
    metabaseReport.options = { metabase: { params: { appId: app.id }, resource: { question: 1 } } };

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer())
        .get(`${getReportRoute}/${v4()}`)
        .set(requestHeader)
        .expect(401)
        .expect('{"statusCode":401,"message":"Unauthorized"}');
    });

    it('Should get metabase signed url successfully', async () => {
      const report = new Report();
      report.id = v4();
      await memberRepo.save(member);
      await reportRepo.save(metabaseReport);
      const tokenResponse = await request(application.getHttpServer())
        .post(authTokenRoute)
        .set('host', appHost.host)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestHeader = {
        Authorization: 'Bearer ' + authToken,
        host: 'test.something.com',
      };

      await request(application.getHttpServer())
        .get(`${getReportRoute}/${metabaseReport.id}`)
        .set(requestHeader)
        .expect(200);
    });
  });
});
