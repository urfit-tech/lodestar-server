import { EntityManager } from 'typeorm';
import { AppWebhook } from '~/entity/AppWebhook';

class WebhookRepository {
  async getAppWebhookByEventAndAppId(
    manager: EntityManager,
    event: string,
    appId: string,
  ): Promise<{ id: string; event: string; url: string } | null> {
    const appWebhookRepo = await manager
      .getRepository(AppWebhook)
      .findOne({ where: { event, enabled: true, app: { id: appId } } });
    if (!appWebhookRepo) return null;
    return { id: appWebhookRepo.id, event: appWebhookRepo.event, url: appWebhookRepo.url };
  }
}

export default WebhookRepository;
