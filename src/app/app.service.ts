import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { App } from '~/entity/App';

import { AppSecret } from './entity/app_secret.entity';
import { AppSetting } from './entity/app_setting.entity';
import { AppModule } from './entity/app_module.entity';

@Injectable()
export class AppService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async getAppByClientId(clientId: string, entityManager?: EntityManager): Promise<App | null> {
    const cb = async (manager: EntityManager) => {
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
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  async getAppSettings(appId: string, entityManager?: EntityManager): Promise<Record<string, string>> {
    const cb = async (manager: EntityManager) => {
      const appSettingRepo = manager.getRepository(AppSetting);
      const founds = await appSettingRepo.findBy({ appId });
      const result = {};

      founds.forEach(({ key, value }) => (result[key] = value));
      return result;
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  async getAppSecrets(appId: string, entityManager?: EntityManager): Promise<Record<string, string>> {
    const cb = async (manager: EntityManager) => {
      const appSecretRepo = manager.getRepository(AppSecret);
      const founds = await appSecretRepo.findBy({ appId });
      const result = {};

      founds.forEach(({ key, value }) => (result[key] = value));
      return result;
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  async getAppModules(appId: string, entityManager?: EntityManager): Promise<Array<string>> {
    const cb = async (manager: EntityManager) => {
      const appModuleRepo = manager.getRepository(AppModule);
      const founds = await appModuleRepo.findBy({ appId });
      return founds.map(({ moduleId }) => moduleId);
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }
}
