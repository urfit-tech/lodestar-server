import { snakeCase } from 'lodash';
import { Issue } from '~/entity/Issue';
import { Operator } from './index';

export class IssueOperator extends Operator {
  constructor(triggeredEvent, entityManager) {
    super(triggeredEvent, entityManager);
  }

  static getIssue = entityManager => async triggeredEvent => {
    switch (triggeredEvent.trigger.name) {
      case 'issue_reply_trigger': {
        const issue_id = triggeredEvent.event.data?.new?.issue_id ?? triggeredEvent.event.data?.old?.issue_id;
        const issue = await entityManager.getRepository(Issue).findOne({ where: { id: issue_id } });
        return Object.assign({}, ...Object.keys(issue).map(key => ({ [`${snakeCase(key)}`]: issue[key] })));
      }
      default:
        return (await triggeredEvent.event.data?.new) ?? triggeredEvent.event.data?.old;
    }
  };

  static getAppId = entityManager => async triggeredEvent =>
    (await IssueOperator.getIssue(entityManager)(triggeredEvent)).app_id;
  getAppId = async () => await IssueOperator.getAppId(null)(this.triggeredEvent);

  static getIntegratedEvent = entityManager => async triggeredEvent => {
    switch (triggeredEvent.trigger.name) {
      case 'issue_reply_trigger': {
        const issue = await IssueOperator.getIssue(entityManager)(triggeredEvent);
        return await {
          ...triggeredEvent,
          event: {
            ...triggeredEvent.event,
            data: {
              old: { ...issue, reply: triggeredEvent.event.data.old },
              new: { ...issue, reply: triggeredEvent.event.data.new },
            },
          },
        };
      }
      default:
        return await triggeredEvent;
    }
  };
  getIntegratedEvent = async () => await IssueOperator.getIntegratedEvent(null)(this.triggeredEvent);
}
