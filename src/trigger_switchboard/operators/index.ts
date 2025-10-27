import { EntityManager } from 'typeorm';
import { AppSetting } from '../../app/entity/app_setting.entity';
import { IntegratedEvent, TriggeredEvent } from '../trigger_switchboard.type';

export abstract class Operator {
  triggeredEvent: TriggeredEvent;
  entityManager: EntityManager;
  constructor(entityManager: EntityManager, triggeredEvent: TriggeredEvent) {
    this.triggeredEvent = triggeredEvent;
    this.entityManager = entityManager;
  }
  static getAppId: (entityManager: EntityManager) => (triggeredEvent: TriggeredEvent) => Promise<string>;
  static getWebhooks: (
    entityManager: EntityManager,
  ) => (triggeredEvent: TriggeredEvent) => (appId: string) => Promise<{ url: string; fetchOption: RequestInit }[]> =
    entityManager => triggeredEvent => async appId =>
      (
        JSON.parse(
          (await entityManager.getRepository(AppSetting).findOne({ where: { appId, key: 'trigger.webhook_urls' } }))
            .value,
        ) as Array<{ trigger_name: string; request_infos: Array<{ url: string; fetchOption: RequestInit }> }>
      ).find(map => map.trigger_name === triggeredEvent.trigger.name || map.trigger_name === 'default').request_infos;

  static getIntegratedEvent: (
    entityManager: EntityManager,
  ) => (triggeredEvent: TriggeredEvent) => Promise<IntegratedEvent>;
  getAppId: () => Promise<string>;
  getWebhooks = async () => await Operator.getWebhooks(this.entityManager)(this.triggeredEvent)(await this.getAppId());
  getIntegratedEvent: () => Promise<IntegratedEvent>;
}

export * from './issue_operator';
