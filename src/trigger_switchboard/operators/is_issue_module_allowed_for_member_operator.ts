import { Operator } from './index';

export class IsIssueModuleAllowedForMemberOperator extends Operator {
  constructor(entityManager, triggeredEvent) {
    super(entityManager, triggeredEvent);
  }

  static getAppId = entityManager => triggeredEvent => triggeredEvent?.event?.data?.member?.appId;

  getAppId = () => IsIssueModuleAllowedForMemberOperator.getAppId(null)(this.triggeredEvent);

  static getIntegratedEvent = entityManager => triggeredEvent => triggeredEvent;
  getIntegratedEvent = () => IsIssueModuleAllowedForMemberOperator.getIntegratedEvent(null)(this.triggeredEvent);
}
