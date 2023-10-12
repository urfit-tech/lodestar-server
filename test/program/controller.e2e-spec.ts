import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import {
  app,
  appHost,
  appPlan,
  member,
  program,
  programContent,
  programContentBody,
  programContentProgress,
  programContentSection,
  role,
} from 'test/data';
import { EntityManager, Repository } from 'typeorm';
import { ApiExceptionFilter } from '~/api.filter';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { ApplicationModule } from '~/application.module';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';
import { Member } from '~/member/entity/member.entity';
import request from 'supertest';
import { Program } from '~/entity/Program';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';

describe('AuthController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let programRepo: Repository<Program>;
  let programContentSectionRepo: Repository<ProgramContentSection>;
  let programContentBodyRepo: Repository<ProgramContentBody>;
  let programContentRepo: Repository<ProgramContent>;
  let programContentProgressRepo: Repository<ProgramContentProgress>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());

    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appSettingRepo = manager.getRepository(AppSetting);
    appSecretRepo = manager.getRepository(AppSecret);
    appHostRepo = manager.getRepository(AppHost);
    memberRepo = manager.getRepository(Member);
    programRepo = manager.getRepository(Program);
    programContentSectionRepo = manager.getRepository(ProgramContentSection);
    programContentBodyRepo = manager.getRepository(ProgramContentBody);
    programContentRepo = manager.getRepository(ProgramContent);
    programContentProgressRepo = manager.getRepository(ProgramContentProgress);

    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
    await programRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    await memberRepo.save(member);
    await programContentProgressRepo.save(programContentProgress);
    await programContentRepo.save(programContent);
    await programContentSectionRepo.save(programContentSection);
    await programContentBodyRepo.save(programContentBody);
    await programRepo.save(program);

    await application.init();
  });

  afterEach(async () => {
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
    await programRepo.delete({});

    await application.close();
  });

  describe('/programs/:memberId (GET)', () => {
    const nonExistentMemberId = 'member_not_found';
    const route = `/programs`;
    const getTokenRoute = '/auth/token';

    it('Should raise error due to member not found', async () => {
      const tokenResponse = await request(application.getHttpServer())
        .post(getTokenRoute)
        .set('host', appHost.host)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const authToken = tokenResponse.body.result.authToken;
      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const { body } = await request(application.getHttpServer()).get(`${route}/${nonExistentMemberId}`).set(header);

      expect(body).toStrictEqual({ code: 'E_NOT_FOUND_MEMBER', message: 'member not found', result: null });
    });

    it('Should successfully get purchased programs by member', async () => {
      const tokenResponse = await request(application.getHttpServer())
        .post(getTokenRoute)
        .set('host', appHost.host)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const authToken = tokenResponse.body.result.authToken;
      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      request(application.getHttpServer()).get(`${route}/${member.id}`).set(header).expect(200);
    });
  });
});
