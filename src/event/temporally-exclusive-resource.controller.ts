import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '~/auth/auth.guard';
import { TemporallyExclusiveResourceService } from './temporally-exclusive-resource.service';
import {
  CreateTemporallyExclusiveResourceDto,
  TemporallyExclusiveResourceType
} from './temporally-exclusive-resource.dto';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'temporally-exclusive-resource',
  version: '2',
})
export class TemporallyExclusiveResourceController {
  constructor(private readonly TemporallyExclusiveResourceService: TemporallyExclusiveResourceService) { }

  @Get('permission-group')
  async findByPermissionGroupIds(
    // @Local('member') member: JwtMember,
    @Query('type') type: 'member' | 'physical_space',
    @Query('ids') permission_group_ids: string,
    @Query('properties') properties?: string,
  ) {
    const [permissionGroupIds, adaptedProperties] =
      [permission_group_ids, properties].map(str => str ? str?.split(',') : undefined)
    return await this.TemporallyExclusiveResourceService.findByPermissionGroupIds(type)({ permissionGroupIds, properties: adaptedProperties });
  }

  @Get(':type/:target')
  async findByTarget(
    @Local('member') member: JwtMember,
    @Param('type') type: TemporallyExclusiveResourceType,
    @Param('target') target: string
  ) {
    return await this.TemporallyExclusiveResourceService.findByTarget(member.appId)(type)([target]);
  }

  @Post('/batch/get/:type')
  async findByTargets(
    @Local('member') member: JwtMember,
    @Param('type') type: TemporallyExclusiveResourceType,
    @Body() targets: Array<string>
  ) {
    return await this.TemporallyExclusiveResourceService.findByTarget(member.appId)(type)(targets);
  }

  @Post('')
  async create(
    @Local('member') member: JwtMember,
    @Body() createTemporallyExclusiveResourceDto: any
  ) {
    const { type, targets } = createTemporallyExclusiveResourceDto
    const adaptedPayload = targets.map(target => ({ type, target, app_id: member.appId }))
    return (await this.TemporallyExclusiveResourceService.create(adaptedPayload))
      .map(resource => {
        const { id, ...rest } = resource
        return { ...rest, temporally_exclusive_resource_id: id }
      })
  }
}
