import { EntityManager } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';

import { App } from './entity/app.entity';
import { CacheService } from '~/utility/cache/cache.service';
import { PermissionInfrastructure } from '~/permission/permission.infra';

import { AppHost } from './entity/app_host.entity';
import { AppInfrastructure } from './app.infra';
import { AppCache } from './app.type';

@Injectable()
export class AppService {
  constructor(
    private readonly appInfra: AppInfrastructure,
    private readonly cacheService: CacheService,
    private readonly permissionInfra: PermissionInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {}

  async getAppInfoByHost(host: string): Promise<AppCache> {
    let appId;
    try {
      ({ appId } = await this.cacheService.getClient().hgetall(`host:${host}`));
    
      if (!appId) {
        throw new Error('no host');
      }
    } catch (error) {
      const appHosts = await this.appInfra.getAppHostsByHost(host, this.entityManager);
      if (appHosts.length > 1) {
        throw new Error('this host can only bind to an app');
      } else if (appHosts.length === 0) {
        throw new Error('no app in this host');
      }

      appId = appHosts.pop().appId;
    }
    return this.getAppInfo(appId);
  }

  async getAppInfo(appId: string): Promise<AppCache> { 
    try {
      return await this.getAppCache(appId);
    } catch (error) {
      const app = await this.appInfra.getById(appId, this.entityManager);
      const orgId = app.orgId || '';
      const host = (await this.getFirstMatchedAppHost(appId)).host;
      const secrets = await this.getAppSecrets(appId);
      const settings = await this.getAppSettings(appId);
      const modules = await this.getAppModules(appId);
      const settingDefaultPermissions: Array<string> = JSON.parse(settings['feature.membership_default_permission'] || '[]');
      const defaultPermissions = await this.permissionInfra.getByIds(settingDefaultPermissions, this.entityManager); 

      let appCache: AppCache = {
        id: appId,
        host,
        name: settings['name'] ?? '',
        settings,
        secrets,
        modules,
        orgId,
        defaultPermissions: defaultPermissions.map(({ id }) => id),
      };
      try {
        await this.setAppCache(host, appCache);
      } catch (error) {
        this.logger.error(`cannot set ${host} cache ${JSON.stringify(appCache)}: ${error}`);
      }
      return appCache;
    }
  }

  async setAppCache(host: string, appCache: AppCache) {
    const expireTime = 60 * 60 // 1 hour
    await this.cacheService.getClient().hset(`host:${host}`, { appId: appCache.id });
    await this.cacheService.getClient().expire(`host:${host}`, expireTime);

    await this.cacheService.getClient()
      .hset(`app:${appCache.id}`, { name: appCache.name, host: appCache.host });
    await this.cacheService.getClient().expire(`app:${appCache.id}`, expireTime);

    appCache.orgId && (await this.cacheService.getClient().set(`app:${appCache.id}:orgId`, appCache.orgId));
    await this.cacheService.getClient().expire(`app:${appCache.id}:orgId`, expireTime);

    Object.keys(appCache.settings).length > 0 &&
      (await this.cacheService.getClient().hset(`app:${appCache.id}:settings`, appCache.settings));
    await this.cacheService.getClient().expire(`app:${appCache.id}:settings`, expireTime);

    Object.keys(appCache.secrets).length > 0 &&
      (await this.cacheService.getClient().hset(`app:${appCache.id}:secrets`, appCache.secrets));
    await this.cacheService.getClient().expire(`app:${appCache.id}:secrets`, expireTime);

    Object.keys(appCache.modules).length > 0 &&
      (await this.cacheService.getClient().sadd(`app:${appCache.id}:modules`, appCache.modules));
    await this.cacheService.getClient().expire(`app:${appCache.id}:modules`, expireTime);
  }

  async getAppCache(appId: string): Promise<AppCache> {
    const existed = await this.cacheService.getClient().exists(
      `app:${appId}`, `app:${appId}:settings`, `app:${appId}:secrets`, `app:${appId}:modules`,
    );

    if (existed < 4) {
      throw new Error('cache is not completed');
    }

    const { name, host } = await this.cacheService.getClient().hgetall(`app:${appId}`);
    const orgId = await this.cacheService.getClient().get(`app:${appId}:orgId`);
    const settings = await this.cacheService.getClient().hgetall(`app:${appId}:settings`);
    const secrets = await this.cacheService.getClient().hgetall(`app:${appId}:secrets`);
    const modules = await this.cacheService.getClient().smembers(`app:${appId}:modules`);
    const settingDefaultPermissions: Array<string> = JSON.parse(settings['feature.membership_default_permission'] || '[]');
    const defaultPermissions = await this.permissionInfra.getByIds(settingDefaultPermissions, this.entityManager); 

    const instance = plainToInstance(AppCache, {
      id: appId,
      orgId,
      defaultPermissions: defaultPermissions.map(({ id }) => id),
      host,
      name,
      settings,
      secrets,
      modules,
    });
    return instance;
  }

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
    return cb(entityManager ? entityManager : this.entityManager);
  }

  async getAppSettings(appId: string, entityManager?: EntityManager): Promise<Record<string, string>> {
    const cb = async (manager: EntityManager) => {
      const founds = await this.appInfra.getAppSettings(appId, manager);
      const result = {};

      founds.forEach(({ key, value }) => (result[key] = value));
      return result;
    };
    return cb(entityManager ? entityManager : this.entityManager);
  }

  async getAppSecrets(appId: string, entityManager?: EntityManager): Promise<Record<string, string>> {
    const cb = async (manager: EntityManager) => {
      const founds = await this.appInfra.getAppSecrets(appId, manager);
      const result = {};

      founds.forEach(({ key, value }) => (result[key] = value));
      return result;
    };
    return cb(entityManager ? entityManager : this.entityManager);
  }

  async getFirstMatchedAppHost(appId: string, entityManager?: EntityManager): Promise<AppHost | null> {
    const cb = async (manager: EntityManager) => {
      const founds = await this.appInfra.getAppHosts(appId, manager);
      return founds.length > 0 ? founds.pop() : null;
    };
    return cb(entityManager ? entityManager : this.entityManager);
  }

  async getAppModules(appId: string, entityManager?: EntityManager): Promise<Array<string>> {
    const cb = async (manager: EntityManager) => {
      const founds = await this.appInfra.getAppModules(appId, manager);
      return founds.map(({ moduleId }) => moduleId);
    };
    return cb(entityManager ? entityManager : this.entityManager);
  }
}
