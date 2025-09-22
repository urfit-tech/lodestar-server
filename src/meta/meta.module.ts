import { Module } from '@nestjs/common';
import { DataDeletionController } from './data-deletion.controller';

@Module({
  controllers: [DataDeletionController],
  providers: [],
  exports: [],
})
export class MetaModule {}
