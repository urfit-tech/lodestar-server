import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '~/auth/auth.guard';
import { EventService } from './event.service';
import { InsertEventsDTO, UpdateEventDTO, InviteResourcesDTO, DeliverEventsDTOBase } from './event.dto';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'event',
  version: '2',
})
export class EventController {
  constructor(private readonly EventService: EventService) {}

  @Get('resource/:resourceId')
  async getEventsByResourceId(
    @Param('resourceId')
    resourceId: string,
    @Query('started_at') started_at: string,
    @Query('until') until: string,
  ) {
    try {
      return this.EventService.getEventsByResourceId(started_at, until)(resourceId);
    } catch (e) {
      Logger.error('Error in getEventsByResourceId', e.stack);
      return { message: 'An error occurred while fetching events by resource ID' };
    }
  }

  @Post('batch/get')
  async getEventsByResourceIds(
    @Query('started_at') started_at: string,
    @Query('until') until: string,
    @Body() resourceIds: Array<string>,
  ) {
    try {
      return this.EventService.getEventsByResourceIds(started_at, until)(resourceIds);
    } catch (e) {
      Logger.error('Error in getEventsByResourceIds', e.stack);
      return { message: 'An error occurred while fetching events by resource IDs' };
    }
  }

  @Post('')
  async createEvents(@Body() insertEventsDTO: InsertEventsDTO, @Local('member') member: JwtMember) {
    try {
      return this.EventService.insertEvents(member.appId)(insertEventsDTO);
    } catch (e) {
      Logger.error('Error in createEvents', e.stack);
      return { message: 'An error occurred while creating events' };
    }
  }

  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    // @Body() updateEventDTO: UpdateEventDTO,
    @Body() updateEventDTO: any,
    @Local('member') member: JwtMember,
  ) {
    const adaptedUpdateEventDTO = {
      ...updateEventDTO,
      metadata: JSON.stringify(updateEventDTO.metadata),
    };
    return await this.EventService.updateEvent(adaptedUpdateEventDTO)(id);
  }

  @Delete(':id')
  async deleteEvent(
    @Param('id')
    id: string,
  ) {
    return await this.EventService.updateEvent({ deleted_at: new Date().toDateString() })(id);
  }

  @Get('products/member/:memberId')
  async getEventRelatedProducts(@Param('memberId') memberId: string) {
    try {
      return this.EventService.getEventRelatedProducts(memberId);
    } catch (e) {
      Logger.error('Error in getEventRelatedProducts', e.stack);
      return { message: 'An error occurred while fetching event-related products' };
    }
  }

  @Post('/invite-resource')
  async batchInviteResource(@Body() inviteResourcesDTO: InviteResourcesDTO) {
    try {
      return await this.EventService.inviteResource(inviteResourcesDTO);
    } catch (e) {
      Logger.error('Error in batchInviteResource', e.stack);
      return { message: 'An error occurred while inviting resources' };
    }
  }

  // @Post('/deliver')
  // async deliver(@Body() deliverEventsDTBase: DeliverEventsDTOBase) {
  //     const adaptedDeliverEventsDTO = { ...deliverEventsDTBase, is_exclusive: true }
  //     return await this.EventService.deliverEvents(adaptedDeliverEventsDTO);
  // }
}
