import { Module } from '@nestjs/common';

import { DefinitionInfrastructure } from './definition.infra';

@Module({
  providers: [DefinitionInfrastructure],
  exports: [DefinitionInfrastructure],
})
export class DefinitionModule {}
