import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { App } from './entity/app.entity';
import { AppSetting } from './entity/app_setting.entity';
import { AppSecret } from './entity/app_secret.entity';
import { AppModule } from './entity/app_module.entity';

@Injectable()
export class AppInfrastructure {
  async getAppByClientId(clientId: string, manager: EntityManager): Promise<App | null> {
    const appRepo = manager.getRepository(App);
    const found = await appRepo.findOne({
      where: {
        appSettings: {
          key: 'auth.service.client_id',
          value: clientId,
        },
      },
      relations: {
        appSettings: true,
        appSecrets: true,
      },
    });
    return found;
  }

  async getAppSettings(appId: string, manager: EntityManager): Promise<Record<string, string>> {
    const appSettingRepo = manager.getRepository(AppSetting);
    const founds = await appSettingRepo.findBy({ appId });
    const result = {};

    founds.forEach(({ key, value }) => result[key] = value);
    return result;
  }

  async getAppSecrets(appId: string, manager: EntityManager): Promise<Record<string, string>> {
    const appSecretRepo = manager.getRepository(AppSecret);
    const founds = await appSecretRepo.findBy({ appId });
    const result = {};

    founds.forEach(({ key, value }) => result[key] = value);
    return result;
  }

  async getAppModules(appId: string, manager: EntityManager): Promise<Array<string>> {
    const appModuleRepo = manager.getRepository(AppModule);
    const founds = await appModuleRepo.findBy({ appId });
    return founds.map(({ moduleId }) => moduleId);
  }
}