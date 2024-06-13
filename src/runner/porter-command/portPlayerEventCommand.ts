import { EntityManager } from 'typeorm';
import { PorterProgramService } from '~/program/porter-program.service';
import { ProgramInfrastructure } from '~/program/program.infra';
import { PorterCommand } from './porterCommandInterface';

class PortPlayerEventCommand implements PorterCommand {
  constructor(
    private readonly porterProgramService: PorterProgramService,
    private readonly programInfra: ProgramInfrastructure,
  ) {}

  public async execute(manager: EntityManager, batchSize = 1000): Promise<void> {
    const pattern = 'program-content-event:*:program-content:*:*';
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.porterProgramService.scanCacheForKeys(pattern, batchSize, cursor);
      cursor = newCursor;

      if (keys.length > 0) {
        const values = await this.porterProgramService.fetchValuesFromCache(keys);
        const keyValuePairs = this.porterProgramService.parseKeyValuePairs(keys, values);
        const programContentIds = new Set(keyValuePairs.map((kvp) => kvp.programContentId));
        const programContentsMap = await this.porterProgramService.fetchProgramContents(
          Array.from(programContentIds),
          manager,
        );
        const programContentLogs = this.porterProgramService.createProgramContentLogs(
          keyValuePairs,
          programContentsMap,
        );

        if (programContentLogs.length > 0) {
          try {
            await this.programInfra.saveProgramContentLogs(programContentLogs, manager);
            await this.porterProgramService.deleteProcessedKeysFromCache(keys);
          } catch (error) {
            await this.porterProgramService.handleBatchSaveFailure(programContentLogs, keys, manager);
          }
        }
      }
    } while (cursor !== '0');
  }
}

export { PortPlayerEventCommand };
