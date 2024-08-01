import { CacheService } from '~/utility/cache/cache.service';
import { EntityManager } from 'typeorm';
import { PodcastService } from '~/podcast/podcast.service';
import { PorterCommand } from './porterCommandInterface';

class PortPodcastProgramCommand implements PorterCommand {
  constructor(private readonly cacheService: CacheService, private readonly podcastService: PodcastService) {}

  public async execute(manager: EntityManager, batchSize = 1000): Promise<void> {
    const pattern = 'podcast-program-event:*:podcast-program:*:*';
    const client = this.cacheService.getClient();
    let cursor = '0';

    do {
      const scanResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = scanResult[0];
      const keys = scanResult[1];
      const progressInfoList = [];

      for (const key of keys) {
        const valueString = await client.get(key);
        if (!valueString) continue;

        const [, memberId, , podcastProgramId, createdAtString] = key.split(':');
        const createdAtTimestamp = parseInt(createdAtString, 10);
        const createdAtDate = new Date(createdAtTimestamp);

        const value = JSON.parse(valueString);
        progressInfoList.push({
          key,
          memberId,
          podcastProgramId,
          progress: value?.progress,
          lastProgress: value?.lastProgress,
          podcastAlbumId: value?.podcastAlbumId,
          created_at: createdAtDate,
        });
      }

      progressInfoList.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

      if (progressInfoList.length > 0) {
        try {
          await this.podcastService.processPodcastProgramProgress(progressInfoList, manager);
          await client.del(...progressInfoList.map((info) => info.key));
        } catch (error) {
          console.error('Batch saving failed:', error);
          for (const progressInfo of progressInfoList) {
            try {
              await this.podcastService.processPodcastProgramProgress([progressInfo], manager);
            } catch (innerError) {
              console.error(
                `Saving progress for ${progressInfo.key} , value ${JSON.stringify(progressInfo)} failed:`,
                innerError,
              );
            }
            await client.del(progressInfo.key);
          }
        }
      }
    } while (cursor !== '0');
  }
}

export { PortPodcastProgramCommand };
