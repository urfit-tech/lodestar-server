import { UnprocessableEntityException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AppSetting } from '../../app/entity/app_setting.entity';
import { TriggerSwitchboardService } from '../trigger_switchboard.service';
import { IntegratedEvent, TriggeredEvent, TriggerWebhookUrl } from '../trigger_switchboard.type';

export abstract class Operator {
  triggeredEvent: TriggeredEvent;
  entityManager: EntityManager;
  appId?: string;
  constructor(entityManager: EntityManager, triggeredEvent: TriggeredEvent) {
    this.triggeredEvent = triggeredEvent;
    this.entityManager = entityManager;
  }
  static getAppId: (entityManager: EntityManager) => (triggeredEvent: TriggeredEvent) => Promise<string>;
  getAppId: () => Promise<string>;
  setAppId = (appId: string) => {
    this.appId = appId;
    return this;
  };

  static getWebhooks: (
    entityManager: EntityManager,
  ) => (triggeredEvent: TriggeredEvent) => (appId: string) => Promise<{ url: string; fetchOption: RequestInit }[]> =
    entityManager => triggeredEvent => async appId => {
      return (
        (
          JSON.parse(
            (await entityManager.getRepository(AppSetting).findOne({ where: { appId, key: 'trigger.webhook_urls' } }))
              .value,
          ) as TriggerWebhookUrl[]
        ).find(
          map =>
            map.trigger_name ===
              TriggerSwitchboardService.getTriggerFromTriggeredEventName(triggeredEvent.trigger.name).trigger ||
            map.trigger_name === 'default',
        )?.request_infos ?? []
      );
    };
  static getIntegratedEvent: (
    entityManager: EntityManager,
  ) => (triggeredEvent: TriggeredEvent) => Promise<IntegratedEvent>;
  getWebhooks = async () => await Operator.getWebhooks(this.entityManager)(this.triggeredEvent)(this?.appId);
  getIntegratedEvent: () => Promise<IntegratedEvent>;

  static callWebhooks: (
    log: ReturnType<typeof TriggerSwitchboardService.log>,
  ) => (
    requestInfos: { url: string; fetchOption: RequestInit }[],
  ) => (integratedEvent: IntegratedEvent) => Promise<any> = log => requestInfos => async integratedEvent => {
    if (requestInfos?.length <= 0) throw new UnprocessableEntityException('Request infos not found.');
    try {
      const results = await Promise.all(
        requestInfos.map(async ({ url, fetchOption }) => {
          const result = await (
            await fetch(url, {
              ...fetchOption,
              body: integratedEvent ? JSON.stringify(integratedEvent) : undefined,
            })
          ).json();
          log(`Executed results for ${url}: \n${JSON.stringify(result)}.`);
          return result;
        }),
      );
      return results;
    } catch (e) {
      log(`Called webhook with failure. ${e}`);
      throw new UnprocessableEntityException(`Called webhook with failure. ${e}`);
    }
  };
  callWebhooks = async (log: ReturnType<typeof TriggerSwitchboardService.log>) =>
    await Operator.callWebhooks(log)(await this.getWebhooks())(await this.getIntegratedEvent());
}

export * from './issue_operator';
export * from './is_issue_module_allowed_for_member_operator';
export * from './error_log';
