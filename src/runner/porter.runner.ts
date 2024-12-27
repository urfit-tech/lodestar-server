import { Injectable, Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';
import { CacheService } from '~/utility/cache/cache.service';
import axios from 'axios';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { MemberService } from '~/member/member.service';
import { PodcastService } from '~/podcast/podcast.service';
import { PorterProgramService } from '~/program/porter-program.service';
import { ProgramInfrastructure } from '~/program/program.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import dayjs from 'dayjs';
import { PortLastLoggedInCommand } from '~/runner/porter-command/portLastLoggedInCommand';
import { PortPhoneServiceInsertEventCommand } from '~/runner/porter-command/portPhoneServiceInsertEventCommand';
import { PortPodcastProgramCommand } from '~/runner/porter-command/portPodcastProgramCommand';
import { PorterCommand } from '~/runner/porter-command/porterCommandInterface';
import { PortPlayerEventCommand } from './porter-command/portPlayerEventCommand';
import { ProgramService } from '~/program/program.service';
import { RunnerInfrastructure } from './runner.infra';

@Injectable()
export class PorterRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly cacheService: CacheService,
    private readonly memberService: MemberService,
    private readonly porterProgramService: PorterProgramService,
    private readonly programInfra: ProgramInfrastructure,
    private readonly memberInfra: MemberInfrastructure,
    private readonly podcastService: PodcastService,
    private readonly programService: ProgramService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    protected readonly runnerInfrastructure: RunnerInfrastructure,
  ) {
    super(PorterRunner.name, logger, distributedLockService, shutdownService, runnerInfrastructure, entityManager);
  }

  async checkAndCallHeartbeat(): Promise<void> {
    const heartbeatUrl = process.env.PORTER_RUNNER_HEARTBEAT_URL;

    const isValidUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    };

    if (heartbeatUrl && typeof heartbeatUrl === 'string' && isValidUrl(heartbeatUrl)) {
      console.log('Calling heartbeat URL:', heartbeatUrl);
      await axios.get(heartbeatUrl);
    } else {
      console.log(`Invalid or no heartbeat URL set, skipping call: ${heartbeatUrl}`);
    }
  }

  public async execute(entityManager?: EntityManager): Promise<void> {
    console.time('Total Execution Time');
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    console.log(`start porter runner ${currentTime}`);
    await this.checkAndCallHeartbeat();

    const commands: PorterCommand[] = [
      new PortLastLoggedInCommand(this.cacheService, this.memberService),
      new PortPlayerEventCommand(this.porterProgramService, this.programInfra, this.programService),
      new PortPhoneServiceInsertEventCommand(this.memberInfra, this.cacheService),
      new PortPodcastProgramCommand(this.cacheService, this.podcastService),
    ];

    const errors: any[] = [];

    for (const command of commands) {
      try {
        await command.execute(this.entityManager, await this.getBatchSize());
      } catch (error) {
        console.error('Porting errors occurred', error);
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      console.error(errors, 'Porting errors occurred');
    }

    console.timeEnd('Total Execution Time');
  }
}
