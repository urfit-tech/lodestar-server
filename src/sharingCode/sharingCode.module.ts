import { Module } from '@nestjs/common';
import { SharingCodeInfrastructure } from './sharingCode.infra';

@Module({ exports: [SharingCodeInfrastructure], providers: [SharingCodeInfrastructure] })
export class SharingCodeModule {}
