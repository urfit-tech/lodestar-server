import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { APIException } from '~/api.excetion';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { PermissionSet } from '~/enums/PermissionSet.enum';

import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceInfo, IssueInvoiceBodyDTO, RevokeInvoiceBodyDTO, SearchInvoiceBodyDTO } from './invoice.dto';

const TOKEN_APP_ID = 'tenant-a';
const ATTACKER_APP_ID = 'tenant-b';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let invoiceService: InvoiceService;
  let entityManager: EntityManager;

  const member: JwtMember = {
    sub: '123',
    appId: TOKEN_APP_ID,
    memberId: 'test-member-id',
    role: 'app-owner',
    permissions: [],
  };

  const invoiceInfo = { MerchantOrderNo: 'order-no' } as InvoiceInfo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: {
            issueInvoiceDirectly: jest.fn().mockResolvedValue({ Status: 'SUCCESS' }),
            searchInvoice: jest.fn().mockResolvedValue({ Status: 'SUCCESS' }),
            revokeInvoice: jest.fn().mockResolvedValue({ Status: 'SUCCESS' }),
          },
        },
        {
          provide: getEntityManagerToken(),
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<InvoiceController>(InvoiceController);
    invoiceService = module.get<InvoiceService>(InvoiceService);
    entityManager = module.get<EntityManager>(getEntityManagerToken());
  });

  describe('issueInvoice', () => {
    const dto: IssueInvoiceBodyDTO = {
      invoiceGatewayId: 'gateway-id',
      invoiceInfo,
      orderId: 'order-id',
    };

    it("Should pass the token's appId to the service", async () => {
      await controller.issueInvoice(member, dto);

      expect(invoiceService.issueInvoiceDirectly).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        dto.orderId,
        dto.invoiceGatewayId,
        dto.invoiceInfo,
        entityManager,
        { executorMemberId: member.memberId },
      );
    });

    it('Should ignore an appId supplied in the request body', async () => {
      const spoofedDto = { ...dto, appId: ATTACKER_APP_ID } as IssueInvoiceBodyDTO;

      await controller.issueInvoice(member, spoofedDto);

      expect(invoiceService.issueInvoiceDirectly).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
      expect(invoiceService.issueInvoiceDirectly).not.toHaveBeenCalledWith(
        ATTACKER_APP_ID,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('Should reject a token without an appId', async () => {
      const memberWithoutAppId = { ...member, appId: undefined } as unknown as JwtMember;

      await expect(controller.issueInvoice(memberWithoutAppId, dto)).rejects.toThrow(APIException);
      expect(invoiceService.issueInvoiceDirectly).not.toHaveBeenCalled();
    });
  });

  describe('searchInvoice', () => {
    const dto: SearchInvoiceBodyDTO = {
      invoiceGatewayId: 'gateway-id',
      invoiceNumber: 'invoice-number',
      invoiceRandomNumber: 'random-number',
    };

    it("Should pass the token's appId to the service", async () => {
      await controller.searchInvoice(member, dto);

      expect(invoiceService.searchInvoice).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        dto.invoiceGatewayId,
        dto.invoiceNumber,
        dto.invoiceRandomNumber,
        entityManager,
      );
    });

    it('Should ignore an appId supplied in the request body', async () => {
      const spoofedDto = { ...dto, appId: ATTACKER_APP_ID } as SearchInvoiceBodyDTO;

      await controller.searchInvoice(member, spoofedDto);

      expect(invoiceService.searchInvoice).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        dto.invoiceGatewayId,
        dto.invoiceNumber,
        dto.invoiceRandomNumber,
        entityManager,
      );
    });

    it('Should reject a token without an appId', async () => {
      const memberWithoutAppId = { ...member, appId: undefined } as unknown as JwtMember;

      await expect(controller.searchInvoice(memberWithoutAppId, dto)).rejects.toThrow(APIException);
      expect(invoiceService.searchInvoice).not.toHaveBeenCalled();
    });
  });

  describe('revokeInvoice', () => {
    const dto: RevokeInvoiceBodyDTO = {
      invoiceGatewayId: 'gateway-id',
      invoiceNumber: 'invoice-number',
      invalidReason: 'invalid-reason',
    };

    it("Should pass the token's appId to the service", async () => {
      await controller.revokeInvoice(member, dto);

      expect(invoiceService.revokeInvoice).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        dto.invoiceGatewayId,
        dto.invoiceNumber,
        dto.invalidReason,
        entityManager,
        member.memberId,
      );
    });

    it('Should ignore an appId supplied in the request body', async () => {
      const spoofedDto = { ...dto, appId: ATTACKER_APP_ID } as RevokeInvoiceBodyDTO;

      await controller.revokeInvoice(member, spoofedDto);

      expect(invoiceService.revokeInvoice).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        dto.invoiceGatewayId,
        dto.invoiceNumber,
        dto.invalidReason,
        entityManager,
        member.memberId,
      );
    });

    it('Should reject a token without an appId', async () => {
      const memberWithoutAppId = { ...member, appId: undefined } as unknown as JwtMember;

      await expect(controller.revokeInvoice(memberWithoutAppId, dto)).rejects.toThrow(APIException);
      expect(invoiceService.revokeInvoice).not.toHaveBeenCalled();
    });
  });

  describe('rejection status', () => {
    it('Should reject with a 403 in the house response shape', async () => {
      const memberWithoutAppId = { ...member, appId: undefined } as unknown as JwtMember;

      expect.assertions(3);
      try {
        await controller.searchInvoice(memberWithoutAppId, {
          invoiceGatewayId: 'gateway-id',
          invoiceNumber: 'invoice-number',
          invoiceRandomNumber: 'random-number',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(APIException);
        expect((error as APIException).getStatus()).toBe(403);
        expect((error as APIException).code).toBe('E_NO_APP_ID');
      }
    });
  });

  describe('admin permission', () => {
    const issueDto: IssueInvoiceBodyDTO = {
      invoiceGatewayId: 'gateway-id',
      invoiceInfo,
      orderId: 'order-id',
    };
    const searchDto: SearchInvoiceBodyDTO = {
      invoiceGatewayId: 'gateway-id',
      invoiceNumber: 'invoice-number',
      invoiceRandomNumber: 'random-number',
    };
    const revokeDto: RevokeInvoiceBodyDTO = {
      invoiceGatewayId: 'gateway-id',
      invoiceNumber: 'invoice-number',
      invalidReason: 'invalid-reason',
    };

    const generalMember: JwtMember = { ...member, role: 'general-member', permissions: [] };
    const salesAdmin: JwtMember = {
      ...member,
      role: 'general-member',
      permissions: [PermissionSet.SALES_RECORDS_ADMIN],
    };

    it('Should let an app-owner through', async () => {
      await controller.issueInvoice(member, issueDto);

      expect(invoiceService.issueInvoiceDirectly).toHaveBeenCalled();
    });

    it('Should let a member holding SALES_RECORDS_ADMIN through', async () => {
      await controller.issueInvoice(salesAdmin, issueDto);

      expect(invoiceService.issueInvoiceDirectly).toHaveBeenCalledWith(
        TOKEN_APP_ID,
        issueDto.orderId,
        issueDto.invoiceGatewayId,
        issueDto.invoiceInfo,
        entityManager,
        { executorMemberId: salesAdmin.memberId },
      );
    });

    // The five sales permissions gate the sales menu (AdminMenu), CHECK_MEMBER_ORDER
    // gates the member page's order tab. Either route reaches manual invoicing.
    it.each([
      PermissionSet.SALES_RECORDS_ADMIN,
      PermissionSet.SALES_RECORDS_NORMAL,
      PermissionSet.SALES_RECORDS_DETAILS,
      PermissionSet.GROSS_SALES_ADMIN,
      PermissionSet.GROSS_SALES_NORMAL,
      PermissionSet.CHECK_MEMBER_ORDER,
    ])('Should let a member holding %s through', async permission => {
      const holder: JwtMember = { ...member, role: 'general-member', permissions: [permission] };

      await controller.issueInvoice(holder, issueDto);

      expect(invoiceService.issueInvoiceDirectly).toHaveBeenCalled();
    });

    it('Should reject a general member on issue', async () => {
      await expect(controller.issueInvoice(generalMember, issueDto)).rejects.toThrow(APIException);
      expect(invoiceService.issueInvoiceDirectly).not.toHaveBeenCalled();
    });

    it('Should reject a general member on search', async () => {
      await expect(controller.searchInvoice(generalMember, searchDto)).rejects.toThrow(APIException);
      expect(invoiceService.searchInvoice).not.toHaveBeenCalled();
    });

    it('Should reject a general member on revoke', async () => {
      await expect(controller.revokeInvoice(generalMember, revokeDto)).rejects.toThrow(APIException);
      expect(invoiceService.revokeInvoice).not.toHaveBeenCalled();
    });

    it('Should reject with a 403 carrying E_NO_PERMISSION', async () => {
      expect.assertions(3);
      try {
        await controller.issueInvoice(generalMember, issueDto);
      } catch (error) {
        expect(error).toBeInstanceOf(APIException);
        expect((error as APIException).getStatus()).toBe(403);
        expect((error as APIException).code).toBe('E_NO_PERMISSION');
      }
    });

    // Backstage access on its own is not enough: the sales menu stays hidden for
    // these members, they only reach /sales because the route's allowedUserRole is
    // declared but never enforced (AdminRouter). The API does not honour that gap.
    it('Should reject a member who only holds BACKSTAGE_ENTER', async () => {
      const backstageOnly: JwtMember = {
        ...member,
        role: 'general-member',
        permissions: [PermissionSet.BACKSTAGE_ENTER],
      };

      await expect(controller.issueInvoice(backstageOnly, issueDto)).rejects.toThrow(APIException);
      expect(invoiceService.issueInvoiceDirectly).not.toHaveBeenCalled();
    });
  });
});
