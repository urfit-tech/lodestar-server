import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { TriggeredEvent, TriggeredEventDTO } from './trigger_switchboard.type';
import { Operator, IssueOperator, IsIssueModuleAllowedForMemberOperator, ErrorLogOperator } from './operators/index';

const triggeredEventToTriggerMap = [
  {
    triggeredEventName: 'issue_trigger',
    trigger: 'issue',
  },
  {
    triggeredEventName: 'issue_reply_trigger',
    trigger: 'issue',
  },
  {
    triggeredEventName: 'is_issue_module_allowed_for_member',
    trigger: 'is_issue_module_allowed_for_member',
  },
  {
    triggeredEventName: 'error_log',
    trigger: 'error_log',
  },
] as const;

type Subclass<T> = {
  new (...args: any[]): T;
};

type TriggerInfo = {
  trigger: Exclude<(typeof triggeredEventToTriggerMap)[number]['trigger'], 'default'>;
  operator: Subclass<Operator>;
  description: string;
  returnType: string;
  defaultReturnValue?: any[];
};

@Injectable()
export class TriggerSwitchboardService {
  ip?: string;
  triggeredEventDTO?: TriggeredEventDTO;
  operator?: InstanceType<(typeof TriggerSwitchboardService.triggerToOperator)[number]['operator']>;
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  static readonly triggeredEventToTriggerMap = triggeredEventToTriggerMap;
  static readonly triggerToOperator: Array<TriggerInfo> = [
    {
      trigger: 'issue',
      operator: IssueOperator,
      description: 'Indicating some changes of questions and replies among members.',
      returnType: 'void',
    },
    {
      trigger: 'is_issue_module_allowed_for_member',
      operator: IsIssueModuleAllowedForMemberOperator,
      description: 'Inquiring whether issue module is allowed for the member.',
      returnType: 'boolean',
      defaultReturnValue: [true],
    },
    {
      trigger: 'error_log',
      operator: ErrorLogOperator,
      description: 'Indicating some error occurring while calling webhooks.',
      returnType: 'void',
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

  static getTriggerInfo = (triggeredEventDTO: TriggeredEventDTO) =>
    TriggerSwitchboardService.getTriggerFromTriggeredEventName(triggeredEventDTO.trigger.name);
  getTriggerInfo = () => TriggerSwitchboardService.getTriggerInfo(this.triggeredEventDTO);

  static getOperatorClass = (triggeredEventDTO: TriggeredEventDTO) =>
    TriggerSwitchboardService.getTriggerInfo(triggeredEventDTO).operator;
  getOperator = () => {
    const operatorClass = TriggerSwitchboardService.getOperatorClass(this.triggeredEventDTO);
    return new operatorClass(this.entityManager, this.triggeredEventDTO);
  };
  setOperator = (operator: InstanceType<ReturnType<typeof TriggerSwitchboardService.getOperatorClass>>) => {
    this.operator = operator;
    return this;
  };

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
    targetOperator: InstanceType<typeof Operator>,
  ) => (triggeredEventDTO: TriggeredEventDTO) => Promise<any[]> = targetOperator => async triggeredEventDTO => {
    const log = TriggerSwitchboardService.log(triggeredEventDTO);
    if (!targetOperator?.appId) throw new UnprocessableEntityException('App id undefined.');
    log(`AppId: ${targetOperator?.appId}.`);
    return await targetOperator.callWebhooks(log);
  };

  execute = async () => {
    const operator = this.getOperator();
    operator.setAppId(await operator.getAppId());
    this.setOperator(operator);
    return await TriggerSwitchboardService.execute(operator)(this.triggeredEventDTO);
  };

  tryCatchWithLog: (process: Function) => unknown = async process => {
    try {
      return await process();
    } catch (error) {
      this.log(error);
      try {
        const event = {
          event: {
            op: 'SELECT',
            data: error,
          },
          created_at: new Date().toISOString(),
          id: '',
          trigger: {
            name: 'error_log',
          },
        } as const;
        const errorLogOperator = new ErrorLogOperator(this.entityManager, event).setAppId(this?.operator?.appId);
        await TriggerSwitchboardService.execute(errorLogOperator)(event);
      } catch (errorWhileSendingError) {
        this.log(`Send error log with failure: ${errorWhileSendingError}`);
      }
    }
  };
}
