import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";

import { App } from "~/entity/App";
import { AppSetting } from "~/entity/AppSetting";

@Injectable()
export class AppService {
  async getAppByClientId(clientId: string, manager: EntityManager): Promise<App> {
    const appRepo = manager.getRepository(App);
    const found = await appRepo.findOneOrFail({
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
}