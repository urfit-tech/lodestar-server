import { Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { DefinitionModule } from '~/definition/definition.module';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker } from '~/tasker/exporter.tasker';

import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberInfrastructure } from './member.infra';
import { AuthService } from '~/auth/auth.service';
import { AppModule } from '~/app/app.module';
import { DeviceModule } from '~/auth/device/device.module';
import { MailerModule } from '~/mailer/mailer.module';
import { CacheService } from '~/utility/cache/cache.service';
import { AuthInfrastructure } from '~/auth/auth.infra';
import { UtilityService } from '~/utility/utility.service';
import { AuthModule } from '~/auth/auth.module';

@Module({
  controllers: [MemberController],
  imports: [
    DefinitionModule,
    AppModule,
    DeviceModule,
    MailerModule,
    BullModule.registerQueue({ name: ImporterTasker.name }),
    BullModule.registerQueue({ name: ExporterTasker.name }),
  ],
  providers: [
    Logger,
    MemberInfrastructure,
    MemberService,
    AuthService,
    CacheService,
    AuthInfrastructure,
    UtilityService,
  ],
  exports: [MemberInfrastructure, MemberService],
})
export class MemberModule {}
