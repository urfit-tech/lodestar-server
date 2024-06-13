import { EntityManager } from 'typeorm';

export interface PorterCommand {
  execute(manager: EntityManager): Promise<void>;
}
