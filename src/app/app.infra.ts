import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { App } from './entity/app.entity';
import { AppSetting } from './entity/app_setting.entity';
import { AppSecret } from './entity/app_secret.entity';
import { AppHost } from './entity/app_host.entity';
import { AppModule } from './entity/app_module.entity';

@Injectable()
export class AppInfrastructure {
  async getById(appId: string, manager: EntityManager): Promise<App> {
    const appRepo = manager.getRepository(App);
    return appRepo.findOne({
      where: { id: appId },
      relations: { appDefaultPermissions: true },
    });
  }

  async getAppSettings(appId: string, manager: EntityManager): Promise<Array<AppSetting>> {
    const appSettingRepo = manager.getRepository(AppSetting);
    const founds = appSettingRepo.findBy({ appId });
    return founds;
  }

  async getAppSecrets(appId: string, manager: EntityManager): Promise<Array<AppSecret>> {
    const appSecretRepo = manager.getRepository(AppSecret);
    const founds = appSecretRepo.findBy({ appId });
    return founds;
  }

  async getAppHosts(appId: string, manager: EntityManager): Promise<Array<AppHost>> {
    const appHostRepo = manager.getRepository(AppHost);
    const founds = await appHostRepo.find({
      where: { appId },
      order: { priority: 'ASC' },
    });
    return founds;
  }

  async getAppHostsByHost(host: string, manager: EntityManager): Promise<Array<AppHost>> {
    const appHostRepo = manager.getRepository(AppHost);
    const founds = await appHostRepo.find({
      where: { host },
    });
    return founds;
  }

  async getAppModules(appId: string, manager: EntityManager): Promise<Array<AppModule>> {
    const appModuleRepo = manager.getRepository(AppModule);
    const founds = await appModuleRepo.findBy({ appId });
    return founds;
  }
}
