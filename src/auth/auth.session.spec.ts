import 'reflect-metadata';
import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { decode } from 'jsonwebtoken';
import request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import DeviceService from './device/device.service';
import MailVerificationCodeService from '~/mailVerificationCode/mailVerificationCode.service';
import { LoginDeviceStatus } from './device/device.type';
import { CacheService } from '~/utility/cache/cache.service';
import { AppService } from '~/app/app.service';

// No DB, Redis or native modules: the real controller and AuthService run against in-memory fakes.
jest.mock('bcrypt', () => ({ compare: async (password: string, hash: string) => hash === `hash:${password}` }));
jest.mock('~/member/member.infra', () => ({ MemberInfrastructure: class MemberInfrastructure {} }));
jest.mock('~/member/member.service', () => ({ MemberService: class MemberService {} }));
jest.mock('~/app/app.service', () => ({ AppService: class AppService {} }));
jest.mock('~/mailer/email/email.service', () => ({ EmailService: class EmailService {} }));
jest.mock('~/utility/utility.service', () => ({ UtilityService: class UtilityService {} }));
jest.mock('~/utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('./auth.infra', () => ({ AuthInfrastructure: class AuthInfrastructure {} }));
jest.mock('./device/device.service', () => ({ __esModule: true, default: class DeviceService {} }));
jest.mock('~/mailVerificationCode/mailVerificationCode.service', () => ({
  __esModule: true,
  default: class MailVerificationCodeService {},
}));
jest.mock('./permission.guard', () => ({ PermissionGuard: class PermissionGuard {} }));

import { LoginStatus } from './auth.type';
const member: any = { id: 'new', appId: 'app', orgId: 'org', email: 'new@example.test', username: 'new', name: 'New' };
const other: any = { id: 'other', appId: 'app' };
const authService: any = { generalLogin: jest.fn() };
const device: any = { checkAndBindDevices: jest.fn() };
const controller = new AuthController(authService, device, { error: jest.fn() } as any, {} as any, {} as any);
const setup = (failure?: string) => {
  const events: string[] = [];
  const req: any = { cookies: {}, headers: {}, ip: '127.0.0.1' };
  const attach = (value: any): any =>
    Object.assign(value, {
      regenerate: jest.fn((cb: any) => {
        events.push('regenerate');
        if (failure === 'regenerate') return cb(new Error('store'));
        req.session = attach({});
        cb();
      }),
      save: jest.fn((cb: any) => {
        events.push('save');
        cb(failure === 'save' ? new Error('store') : null);
      }),
      destroy: jest.fn((cb: any) => {
        events.push('destroy');
        delete req.session;
        cb(new Error('cleanup store failure'));
      }),
    });
  const stale = attach({
    app: { currentMemberId: 'other', members: [other] },
    unrelated: { currentMemberId: 'unrelated' },
  });
  req.session = stale;
  const response: any = { cookie: jest.fn() };
  const login = () =>
    controller.generalLogin(
      req,
      { id: 'app', modules: [] } as any,
      stale,
      '',
      { appId: 'app', account: 'new', password: 'password' } as any,
      response,
    );
  return { req, stale, response, events, login };
};
beforeEach(() => {
  authService.generalLogin.mockReset().mockResolvedValue({ status: LoginStatus.SUCCESS, member, authToken: 'token' });
});
it('writes request.session after regeneration, saves, and leaves the stale Nest @Session reference untouched', async () => {
  const { req, stale, events, login } = setup();
  expect(await login()).toMatchObject({ code: 'SUCCESS', result: { authToken: 'token' } });
  expect(events).toEqual(['regenerate', 'save']);
  expect(req.session).not.toBe(stale);
  expect(req.session.app).toMatchObject({
    currentMemberId: 'new',
    members: [other, expect.objectContaining({ id: 'new' })],
  });
  expect(req.session.unrelated).toBeUndefined();
  expect(stale.app.currentMemberId).toBe('other');
});
it.each(['regenerate', 'save'])('%s failure fails closed even if cleanup destroy also fails', async failure => {
  const { req, events, response, login } = setup(failure);
  expect(await login()).toEqual({ code: 'E_SESSION', message: 'cannot save session', result: null });
  expect(req.session).toBeFalsy();
  expect(events).toContain('destroy');
  expect(response.cookie).not.toHaveBeenCalled();
});
it('does not rotate on a credential rejection', async () => {
  authService.generalLogin.mockResolvedValue({ status: LoginStatus.E_PASSWORD });
  const { events, login } = setup();
  expect(await login()).toMatchObject({ code: 'E_PASSWORD' });
  expect(events).toEqual([]);
});
