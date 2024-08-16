import { EntityManager } from 'typeorm';
import { PorterProgramService } from '~/program/porter-program.service';
import { ProgramInfrastructure } from '~/program/program.infra';
import { PorterCommand, PorterPlayerEventCommand } from './porterCommandInterface';
import { ProgramService } from '~/program/program.service';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ParsedProgressData, ProgramContentEvent } from './types/playerEvent';

class CreateProgramContentLogsCommand implements PorterPlayerEventCommand {
  constructor(
    private readonly porterProgramService: PorterProgramService,
    private readonly programInfra: ProgramInfrastructure,
  ) {}

  public async execute(
    events: ProgramContentEvent[],
    programContentsMap: Map<string, ProgramContent>,
    keys: string[],
    manager: EntityManager,
  ): Promise<void> {
    const programContentLogs = this.porterProgramService.createProgramContentLogs(events, programContentsMap);

    if (programContentLogs.length > 0) {
      try {
        await this.programInfra.saveProgramContentLogs(programContentLogs, manager);
      } catch (error) {
        await this.porterProgramService.handleBatchSaveFailure(programContentLogs, keys, manager);
      }
    }
  }
}

// class SyncProgramContentProgress implements PorterPlayerEventCommand {
//   constructor(private readonly programService: ProgramService) {}

//   public async execute(events: ProgramContentEvent[]): Promise<void> {
//     const progressDataList = events
//       .map(this._parseProgramPlayerDataValueString)
//       .filter((data) => data !== null) as ParsedProgressData[];

//     for (const progressData of progressDataList) {
//       await this._trackProgress(progressData);
//     }
//   }

//   private _parseProgramPlayerDataValueString(event: ProgramContentEvent): ParsedProgressData | null {
//     const { progress } = JSON.parse(event.valueString);
//     if (!progress) {
//       return null;
//     }
//     return {
//       memberId: event.memberId,
//       programContentId: event.programContentId,
//       progress: progress,
//       lastProgress: null,
//     };
//   }

//   private async _trackProgress(progressData: ParsedProgressData): Promise<void> {
//     try {
//       await this.programService.trackProgramContentProgress(progressData);
//     } catch (error) {
//       this._handleTrackingError(progressData, error);
//     }
//   }

//   private _handleTrackingError(progressData: ParsedProgressData, error: any): void {
//     console.error('Failed to track progress:', {
//       memberId: progressData.memberId,
//       programContentId: progressData.programContentId,
//       progress: progressData.progress,
//       error: error,
//     });
//   }
// }

class PortPlayerEventCommand implements PorterCommand {
  private readonly commands: PorterPlayerEventCommand[];

  constructor(
    private readonly porterProgramService: PorterProgramService,
    private readonly programInfra: ProgramInfrastructure,
    private readonly programService: ProgramService,
  ) {
    this.commands = [
      new CreateProgramContentLogsCommand(this.porterProgramService, this.programInfra),
      // new SyncProgramContentProgress(this.programService),
    ];
  }

  public async execute(manager: EntityManager, batchSize = 1000): Promise<void> {
    const pattern = 'program-content-event:*:program-content:*:*';
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.porterProgramService.scanCacheForKeys(pattern, batchSize, cursor);
      cursor = newCursor;

      if (keys.length === 0) continue;

      const values = await this.porterProgramService.fetchValuesFromCache(keys);
      const events = this.porterProgramService.parseKeyValuePairs(keys, values);
      const programContentIds = new Set(events.map((event) => event.programContentId));
      const programContentsMap = await this.porterProgramService.fetchProgramContents(
        Array.from(programContentIds),
        manager,
      );

      await Promise.all(this.commands.map((command) => command.execute(events, programContentsMap, keys, manager)));

      await this.porterProgramService.deleteProcessedKeysFromCache(keys);
    } while (cursor !== '0');
  }
}

export { PortPlayerEventCommand };
