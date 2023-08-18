import { Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { DefinitionModule } from '~/definition/definition.module';
import { AuthModule } from '~/auth/auth.module';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker } from '~/tasker/exporter.tasker';

import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberInfrastructure } from './member.infra';

@Module({
  controllers: [MemberController],
  imports: [
    DefinitionModule,
    AuthModule,
    BullModule.registerQueue({ name: ImporterTasker.name }),
    BullModule.registerQueue({ name: ExporterTasker.name }),
  ],
  providers: [Logger, MemberInfrastructure, MemberService],
  exports: [MemberInfrastructure, MemberService],
})
export class MemberModule {}
