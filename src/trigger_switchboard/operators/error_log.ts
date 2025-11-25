import { Operator } from './index';

export class ErrorLogOperator extends Operator {
  appId?: string;
  constructor(entityManager, triggeredEvent) {
    super(entityManager, triggeredEvent);
  }

  getAppId = async () => await this?.appId;

  static getIntegratedEvent = entityManager => triggeredEvent => triggeredEvent;
  getIntegratedEvent = async () => await ErrorLogOperator.getIntegratedEvent(this.entityManager)(this.triggeredEvent);
}
