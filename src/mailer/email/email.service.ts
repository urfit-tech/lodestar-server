import { readFileSync } from 'fs';
import { Queue } from 'bull';
import { EntityManager } from 'typeorm';
import Mustache from 'mustache';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';

import { AppInfrastructure } from '~/app/app.infra';
import { MailJob } from '~/tasker/mailer.tasker';

@Injectable()
export class EmailService {
  constructor(
    private readonly appInfra: AppInfrastructure,
    // @InjectQueue(MailerTasker.name) private readonly mailerQueue: Queue,
    @InjectQueue('mailer') private readonly mailerQueue: Queue,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getAppEmailTemplate(appId: string, catalog: string, manager?: EntityManager): Promise<{
    subject: string | null;
    content: string | null
  }> {
    const cb = async (manager: EntityManager) => {
      const appTemplates = await this.appInfra.getAppEmailTemplateByCatalog(appId, catalog, manager);

      if (appTemplates.length === 0) {
        return { subject: null, content: this.getDefaultTemplate(catalog) };  
      }
      const [appTemplate] = appTemplates;
      return { subject: appTemplate.subject, content: appTemplate.emailTemplate.content };
    };
    return cb(manager ? manager : this.entityManager);
  }

  public async insertEmailJobIntoQueue(options: {
    appId: string;
    catalog: string;
    targetMemberIds: Array<string>;
    partials: Record<string, string>;
    subject: string;
    manager: EntityManager;
  }) {
    try {
      const { appId, catalog, targetMemberIds, partials, subject, manager } = options;
      const { content } = await this.getAppEmailTemplate(appId, catalog, manager);

      const job: MailJob = {
        appId,
        subject,
        to: targetMemberIds,
        cc: [],
        bcc: [],
        content: content ? Mustache.render(content, partials) : this.renderPartials(partials),
      };
      this.mailerQueue.add(job);
    } catch {

    }
  }

  private getDefaultTemplate(catalog: string): string | null {
    try {
      return readFileSync(`./templates/${catalog}.hbs`).toString();
    } catch {
      return null;
    }
  }
  
  private renderPartials(partials: { [key: string]: any }) {
    const content: string[] = [];
    for (const key in partials) {
      content.push(`${key}: ${JSON.stringify(partials[key])}`);
    }
    return content.join('\n');
  }
}
