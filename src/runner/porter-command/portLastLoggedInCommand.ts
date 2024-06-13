import { CacheService } from '~/utility/cache/cache.service';
import { MemberService } from '~/member/member.service';
import { EntityManager } from 'typeorm';
import { PorterCommand } from './porterCommandInterface';

class PortLastLoggedInCommand implements PorterCommand {
  constructor(private readonly cacheService: CacheService, private readonly memberService: MemberService) {}

  public async execute(manager: EntityManager, batchSize = 1000): Promise<void> {
    let cursor = '0';
    do {
      const reply = await this.cacheService.getClient().scan(cursor, 'MATCH', 'last-logged-in:*', 'COUNT', batchSize);
      cursor = reply[0];
      const keys = reply[1];

      if (keys.length === 0) {
        console.warn('No last logged in member keys found');
        break;
      }

      const timestamps = await this.cacheService.getClient().mget(keys);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const [, memberId] = key.split(':');
        const loginedAt = timestamps[i];

        try {
          await this.memberService.updateMemberLoginDate(memberId, new Date(loginedAt), manager);
          await this.cacheService.getClient().del(key);
        } catch (error) {
          console.error(`porting ${key} failed:`, error);
          await this.cacheService.getClient().del(key);
        }
      }
    } while (cursor !== '0');
  }
}

export { PortLastLoggedInCommand };
