import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { TriggeredEvent, TriggeredEventDTO } from './trigger_switchboard.type';
import { Operator, IssueOperator } from './operators/index';

const triggeredEventToTriggerMap = [
  {
    triggeredEventName: 'issue_trigger',
    trigger: 'issue',
  },
  {
    triggeredEventName: 'issue_reply_trigger',
    trigger: 'issue',
  },
] as const;

type TriggerInfo = {
  trigger: Exclude<(typeof triggeredEventToTriggerMap)[number]['trigger'], 'default'>;
  operator: typeof Operator;
  description: string
};

@Injectable()
export class TriggerSwitchboardService {
  ip?: string;
  triggeredEventDTO?: TriggeredEventDTO;
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  static readonly triggeredEventToTriggerMap = triggeredEventToTriggerMap;
  static readonly triggerToOperator: Array<TriggerInfo> = [
    {
      trigger: 'issue',
      operator: IssueOperator,
      description: 'Questions and replies among members.'
    },
  ];

  static getTriggeredEventId: (triggeredEventDTO: TriggeredEventDTO) => string = triggeredEventDTO =>
    triggeredEventDTO.id;
  getTriggeredEventId = () => TriggerSwitchboardService.getTriggeredEventId(this.triggeredEventDTO);

  static log: (triggeredEventDTO: TriggeredEventDTO) => (message: string) => void = triggeredEventDTO => message =>
    console.log(`[Switchboard] Event ${TriggerSwitchboardService.getTriggeredEventId(triggeredEventDTO)}: ${message}`);
  log = message => TriggerSwitchboardService.log(this.triggeredEventDTO)(message);

  setIp = (ip: string) => {
    this.ip = ip;
    this.log(`Triggered event received from ip ${this.ip}.`);
    return this;
  };

  setTriggeredEventDTO = (triggeredEventDTO: TriggeredEventDTO) => {
    this.triggeredEventDTO = triggeredEventDTO;
    this.log(`Triggered event DTO: ${JSON.stringify(this.triggeredEventDTO)}`);
    return this;
  };

  //ToDo: Change to the real ip list in env
  static isRequestSourceValid: (ip: String) => boolean = ip =>
    JSON.parse(process.env.TRIGGERED_EVENT_IP_WHITE_LIST).includes(ip);
  isRequestSourceValid = () => TriggerSwitchboardService.isRequestSourceValid(this.ip);

  static getTriggerFromTriggeredEventName: (triggeredEventName: string) => TriggerInfo = triggeredEventName => {
    const { triggeredEventToTriggerMap, triggerToOperator } = TriggerSwitchboardService;
    const targetTrigger = triggeredEventToTriggerMap.find(
      item => item.triggeredEventName === triggeredEventName,
    ).trigger;
    return triggerToOperator.find(item => item.trigger === targetTrigger);
  };
  getTriggerFromTriggeredEventName = () =>
    TriggerSwitchboardService.getTriggerFromTriggeredEventName(this.triggeredEventDTO.trigger.name);

  static getTriggerInfo: (triggeredEventDTO: TriggeredEventDTO) => TriggerInfo = triggeredEventDTO =>
    TriggerSwitchboardService.getTriggerFromTriggeredEventName(triggeredEventDTO.trigger.name);
  getTriggerInfo = () => TriggerSwitchboardService.getTriggerInfo(this.triggeredEventDTO);

  static getOperator: (triggeredEventDTO: TriggeredEventDTO) => typeof Operator = triggeredEventDTO =>
    TriggerSwitchboardService.getTriggerInfo(triggeredEventDTO).operator;
  getOperator = () => TriggerSwitchboardService.getOperator(this.triggeredEventDTO);

  static getAdaptedTriggeredEvent: (triggeredEventDTO: TriggeredEventDTO) => TriggeredEvent = triggeredEventDTO => ({
    event: (() => {
      const _ = JSON.parse(JSON.stringify(triggeredEventDTO.event));
      delete _.trace_context;
      return _;
    })(),
    trigger: {
      type: TriggerSwitchboardService.getTriggerInfo(triggeredEventDTO).trigger,
      name: triggeredEventDTO.trigger.name,
    },
  });
  getAdaptedTriggeredEvent = triggeredEventDTO => TriggerSwitchboardService.getAdaptedTriggeredEvent(triggeredEventDTO);

  static execute: (
    entityManager: EntityManager,
  ) => (TargetOperator: typeof Operator) => (triggeredEventDTO: TriggeredEventDTO) => Promise<void> =
    entityManager => TargetOperator => async triggeredEventDTO => {
      const triggeredEvent = TriggerSwitchboardService.getAdaptedTriggeredEvent(triggeredEventDTO);
      const appId = await TargetOperator.getAppId(entityManager)(triggeredEvent);
      if(!appId) throw new UnprocessableEntityException('App id undefined.')
      TriggerSwitchboardService.log(triggeredEventDTO)(`AppId: ${appId}.`);
      const requestInfos = await TargetOperator.getWebhooks(entityManager)(triggeredEvent)(appId);
      if(requestInfos?.length <= 0) throw new UnprocessableEntityException('Request infos not found.')
      const integratedEvent = await TargetOperator.getIntegratedEvent(entityManager)(triggeredEvent);
      requestInfos.forEach(async ({ url, fetchOption }) => {
        const result = await fetch(url, { ...fetchOption, body: JSON.stringify(integratedEvent) });
        TriggerSwitchboardService.log(triggeredEventDTO)(`Executed results for ${url}: \n${JSON.stringify(result)}.`);
      });
    };

  execute = () => TriggerSwitchboardService.execute(this.entityManager)(this.getOperator())(this.triggeredEventDTO);
}
