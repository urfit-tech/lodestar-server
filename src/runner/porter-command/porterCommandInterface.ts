import { EntityManager } from 'typeorm';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentEvent } from './types/playerEvent';

export interface PorterCommand {
  execute(manager: EntityManager): Promise<void>;
}

export interface PorterPlayerEventCommand {
  execute(
    events: ProgramContentEvent[],
    programContentsMap?: Map<string, ProgramContent>,
    keys?: string[],
    manager?: EntityManager,
  ): Promise<void>;
}
