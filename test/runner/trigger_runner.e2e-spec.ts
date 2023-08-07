import { EntityManager, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { Setting } from '~/entity/Setting';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/entity/App';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { Runner } from '~/runner/runner';
import { RunnerModule } from '~/runner/runner.module';
import { TriggerRunner } from '~/runner/trigger.runner';
import { CacheService } from '~/utility/cache/cache.service';

import { autoRollbackTransaction } from '../utils';
import { appPlan } from '../data';

describe('TriggerRunner (e2e)', () => {
  let application: INestApplication;
  
  let cacheService: CacheService;
  let manager: EntityManager;
  let settingRepo: Repository<Setting>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;

  let setting: Setting;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RunnerModule.forRoot({
          workerName: TriggerRunner.name,
          nodeEnv: 'test',
          clazz: TriggerRunner,
          noGo: true,
        }),
      ],
    }).compile();

    application = moduleFixture.createNestApplication();

    cacheService = application.get<CacheService>(CacheService);
    manager = application.get<EntityManager>(getEntityManagerToken());
    settingRepo = manager.getRepository(Setting);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);

    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);

    setting = await settingRepo.findOneBy({});
    await application.init();
  });

  afterAll(async () => {
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('AppSetting Handler', () => {
    it('Should erase app setting when update', async () => {
      const triggerRunner = application.get<TriggerRunner>(Runner);
      const updatedApp = new App();
      updatedApp.id = 'updated-app';
      updatedApp.symbol = 'UPD';
      updatedApp.appPlan = appPlan;

      const appSetting = new AppSetting();
      appSetting.app = updatedApp;
      appSetting.key = setting.key;
      appSetting.value = 'some value';

      await autoRollbackTransaction(manager, async (manager) => {
        await manager.save(updatedApp);
        await manager.save(appSetting);

        await cacheService.getClient().set(`app:${updatedApp.id}:settings`, 'updated something');
        const inCacheValue = await cacheService.getClient().get(`app:${updatedApp.id}:settings`);
        expect(inCacheValue).not.toBeNull();
        expect(inCacheValue).toEqual('updated something');

        appSetting.value = 'updated value';
        await manager.save(appSetting);

        await triggerRunner.execute(manager);
        
        const afterClearCacheValue = await cacheService.getClient().get(`app:${updatedApp.id}:settings`);
        expect(afterClearCacheValue).toBeNull();
      });
    });

    it('Should erase app setting when delete', async () => {
      const triggerRunner = application.get<TriggerRunner>(Runner);
      const deletedApp = new App();
      deletedApp.id = 'deleted-app';
      deletedApp.symbol = 'DEL';
      deletedApp.appPlan = appPlan;

      const appSetting = new AppSetting();
      appSetting.app = deletedApp;
      appSetting.key = setting.key;
      appSetting.value = 'some value';

      await autoRollbackTransaction(manager, async (manager) => {
        await manager.save(deletedApp);
        await manager.save(appSetting);

        await cacheService.getClient().set(`app:${deletedApp.id}:settings`, 'delete something');
        const inCacheValue = await cacheService.getClient().get(`app:${deletedApp.id}:settings`);
        expect(inCacheValue).not.toBeNull();
        expect(inCacheValue).toEqual('delete something');

        await manager.remove(appSetting);

        await triggerRunner.execute(manager);
        
        const afterClearCacheValue = await cacheService.getClient().get(`app:${deletedApp.id}:settings`);
        expect(afterClearCacheValue).toBeNull();
      });
    });
  });

  describe('AppSecret Handler', () => {
    it('Should erase app secret when update', async () => {
      const triggerRunner = application.get<TriggerRunner>(Runner);
      const updatedApp = new App();
      updatedApp.id = 'updated-app';
      updatedApp.symbol = 'UPD';
      updatedApp.appPlan = appPlan;

      const appSecret = new AppSecret();
      appSecret.app = updatedApp;
      appSecret.key = setting.key;
      appSecret.value = 'some value';

      await autoRollbackTransaction(manager, async (manager) => {
        await manager.save(updatedApp);
        await manager.save(appSecret);

        await cacheService.getClient().set(`app:${updatedApp.id}:secrets`, 'updated something');
        const inCacheValue = await cacheService.getClient().get(`app:${updatedApp.id}:secrets`);
        expect(inCacheValue).not.toBeNull();
        expect(inCacheValue).toEqual('updated something');

        appSecret.value = 'updated value';
        await manager.save(appSecret);

        await triggerRunner.execute(manager);
        
        const afterClearCacheValue = await cacheService.getClient().get(`app:${updatedApp.id}:secrets`);
        expect(afterClearCacheValue).toBeNull();
      });
    });

    it('Should erase app secret when delete', async () => {
      const triggerRunner = application.get<TriggerRunner>(Runner);
      const deletedApp = new App();
      deletedApp.id = 'deleted-app';
      deletedApp.symbol = 'DEL';
      deletedApp.appPlan = appPlan;

      const appSecret = new AppSecret();
      appSecret.app = deletedApp;
      appSecret.key = setting.key;
      appSecret.value = 'some value';

      await autoRollbackTransaction(manager, async (manager) => {
        await manager.save(deletedApp);
        await manager.save(appSecret);

        await cacheService.getClient().set(`app:${deletedApp.id}:secrets`, 'delete something');
        const inCacheValue = await cacheService.getClient().get(`app:${deletedApp.id}:secrets`);
        expect(inCacheValue).not.toBeNull();
        expect(inCacheValue).toEqual('delete something');

        await manager.remove(appSecret);

        await triggerRunner.execute(manager);
        
        const afterClearCacheValue = await cacheService.getClient().get(`app:${deletedApp.id}:secrets`);
        expect(afterClearCacheValue).toBeNull();
      });
    });
  });

  describe('AppHost Handler', () => {
    it('Should erase app host when update', async () => {
      const triggerRunner = application.get<TriggerRunner>(Runner);
      const updatedApp = new App();
      updatedApp.id = 'updated-app';
      updatedApp.symbol = 'UPD';
      updatedApp.appPlan = appPlan;

      const appHost = new AppHost();
      appHost.app = updatedApp;
      appHost.host = 'some_host'

      await autoRollbackTransaction(manager, async (manager) => {
        const originHost = appHost.host;
        await manager.save(updatedApp);
        await manager.save(appHost);

        await cacheService.getClient().set(`host:${originHost}`, 'some_host');
        const inCacheValue = await cacheService.getClient().get(`host:${originHost}`);
        expect(inCacheValue).not.toBeNull();
        expect(inCacheValue).toEqual('some_host');

        appHost.priority = 1;
        await manager.save(appHost);

        await triggerRunner.execute(manager);
        
        const afterClearCacheValue = await cacheService.getClient().get(`host:${originHost}`);
        expect(afterClearCacheValue).toBeNull();
      });
    });

    it('Should erase app host when delete', async () => {
      const triggerRunner = application.get<TriggerRunner>(Runner);
      const deletedApp = new App();
      deletedApp.id = 'deleted-app';
      deletedApp.symbol = 'DEL';
      deletedApp.appPlan = appPlan;

      const appHost = new AppHost();
      appHost.app = deletedApp;
      appHost.host = 'some_host';

      await autoRollbackTransaction(manager, async (manager) => {
        const originHost = appHost.host;
        await manager.save(deletedApp);
        await manager.save(appHost);

        await cacheService.getClient().set(`host:${originHost}`, 'some_host');
        const inCacheValue = await cacheService.getClient().get(`host:${originHost}`);
        expect(inCacheValue).not.toBeNull();
        expect(inCacheValue).toEqual('some_host');

        await manager.remove(appHost);

        await triggerRunner.execute(manager);
        
        const afterClearCacheValue = await cacheService.getClient().get(`host:${originHost}`);
        expect(afterClearCacheValue).toBeNull();
      });
    });
  });
});
