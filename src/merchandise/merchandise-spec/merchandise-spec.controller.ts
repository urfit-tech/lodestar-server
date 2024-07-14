import { Get, Controller, Param, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { APIException } from '~/api.excetion';
import { AppCache } from '~/app/app.type';
import { AuthService } from '~/auth/auth.service';
import { Local } from '~/decorator';
import { MerchandiseSpecService } from './merchandise-spec.service';

@ApiTags('MerchandiseSpec')
@ApiBearerAuth()
@Controller({
  path: 'merchandise-spec',
  version: '2',
})
export class MerchandiseSpecController {
  constructor(
    private readonly merchandiseSpecService: MerchandiseSpecService,
    private readonly authService: AuthService,
  ) {}
  @Get(':merchandiseSpecId/inventory/status')
  async getMerchandiseSpecInventoryStatus(
    @Local('appCache') appCache: AppCache,
    @Param('merchandiseSpecId') merchandiseSpecId: string,
    @Headers('Authorization') authorization?: string,
  ) {
    try {
      let role: string | undefined, permissions: string[] | undefined, memberId: string | undefined;

      const token = authorization?.split(' ')[1];
      if (token && token !== 'null') {
        const member = this.authService.verify(token);
        role = member.role;
        permissions = member.permissions;
        memberId = member.memberId;
      }

      const result = await this.merchandiseSpecService.getMerchandiseSpecInventoryStatus(
        appCache.id,
        merchandiseSpecId,
        memberId,
        role,
        permissions,
      );
      return { code: 'SUCCESS', message: 'get url success', result };
    } catch (error) {
      console.log(error);
      throw new APIException({
        code: 'E_MERCHANDISE_SPEC_GET_INVENTORY_STATUS',
        message: `Failed to get merchandise spec inventory status: ${error.message}`,
        result: null,
      });
    }
  }
}
