import { createHmac } from 'crypto';
import { Readable } from 'stream';
import { json } from 'express';
import { LeadController } from './lead.controller';
import { isValidMetaSignature, keepRawBodyForWebhooks } from '../webhook-signature';

const sign = (body: Buffer, secret: string) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

describe('isValidMetaSignature', () => {
  const body = Buffer.from('{"id":"lead1","email":"a@example.com"}');

  it('accepts the HMAC-SHA256 of the raw body', () => {
    expect(isValidMetaSignature(body, sign(body, 'secret'), 'secret')).toBe(true);
  });

  it.each([
    ['wrong secret', sign(body, 'other'), 'secret'],
    ['no secret configured', sign(body, 'secret'), undefined],
    ['empty secret', sign(body, ''), ''],
    ['missing header', undefined, 'secret'],
    ['sha1 header', `sha1=${createHmac('sha1', 'secret').update(body).digest('hex')}`, 'secret'],
    ['bare hex without algorithm', createHmac('sha256', 'secret').update(body).digest('hex'), 'secret'],
    ['truncated signature', sign(body, 'secret').slice(0, 40), 'secret'],
  ])('rejects %s', (_label, header, secret) => {
    expect(isValidMetaSignature(body, header as string, secret as string)).toBe(false);
  });

  it('rejects a body that differs from the signed bytes', () => {
    const reformatted = Buffer.from('{"id": "lead1", "email": "a@example.com"}');
    expect(isValidMetaSignature(reformatted, sign(body, 'secret'), 'secret')).toBe(false);
  });

  it('rejects when the raw body is not available', () => {
    expect(isValidMetaSignature(undefined, sign(body, 'secret'), 'secret')).toBe(false);
  });
});

describe('keepRawBodyForWebhooks with the express json parser', () => {
  const parse = (url: string, payload: string) =>
    new Promise<any>((resolve, reject) => {
      const req: any = Readable.from([Buffer.from(payload)]);
      req.headers = { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(payload)) };
      req.method = 'POST';
      req.url = url;
      req.originalUrl = url;
      json({ limit: '10mb', verify: keepRawBodyForWebhooks })(req, {} as any, (err?: any) =>
        err ? reject(err) : resolve(req),
      );
    });

  it('keeps the exact bytes for webhook routes and still parses the JSON', async () => {
    const payload = '{"id": "lead1",  "email":"a@example.com"}';
    const req = await parse('/api/v2/webhooks/meta/lead/appA', payload);
    expect(req.body).toEqual({ id: 'lead1', email: 'a@example.com' });
    expect(Buffer.isBuffer(req.rawBody)).toBe(true);
    expect(req.rawBody.toString()).toBe(payload);
  });

  it('does not keep raw bodies for other routes', async () => {
    const req = await parse('/api/v2/members/saleLeadMemberData', '{"managerId":"m1"}');
    expect(req.body).toEqual({ managerId: 'm1' });
    expect(req.rawBody).toBeUndefined();
  });
});

describe('LeadController.webhook', () => {
  const body = { id: 'lead1', email: 'a@example.com', full_name: 'A', phone_number: '0912345678' } as any;
  const rawBody = Buffer.from(JSON.stringify(body));
  let appService: { getAppInfo: jest.Mock };
  let leadService: { storeLead: jest.Mock };
  let config: Record<string, string | undefined>;
  let controller: LeadController;

  beforeEach(() => {
    config = { META_VERIFY_TOKEN: 'verify', META_APP_SECRET: undefined };
    appService = { getAppInfo: jest.fn().mockResolvedValue({ id: 'appA', secrets: {} }) };
    leadService = { storeLead: jest.fn().mockResolvedValue(undefined) };
    const configService = { get: jest.fn((key: string) => config[key]) };
    controller = new LeadController(configService as any, leadService as any, appService as any);
  });

  it('fails closed when no Meta app secret is configured', async () => {
    await expect(controller.webhook('appA', body, { rawBody } as any, sign(rawBody, 'anything'))).rejects.toMatchObject(
      { code: 'E_META_SIGNATURE' },
    );
    expect(leadService.storeLead).not.toHaveBeenCalled();
  });

  it('refuses an unsigned or wrongly signed request when the env secret is set', async () => {
    config.META_APP_SECRET = 'env-secret';
    await expect(controller.webhook('appA', body, { rawBody } as any, undefined)).rejects.toMatchObject({
      code: 'E_META_SIGNATURE',
    });
    await expect(controller.webhook('appA', body, { rawBody } as any, sign(rawBody, 'guess'))).rejects.toMatchObject({
      code: 'E_META_SIGNATURE',
    });
    expect(leadService.storeLead).not.toHaveBeenCalled();
  });

  it('stores the lead for a request signed with the env secret', async () => {
    config.META_APP_SECRET = 'env-secret';
    await controller.webhook('appA', body, { rawBody } as any, sign(rawBody, 'env-secret'));
    expect(leadService.storeLead).toHaveBeenCalledWith({ id: 'appA', secrets: {} }, body);
  });

  it('prefers the per-app meta.app_secret over the env secret', async () => {
    config.META_APP_SECRET = 'env-secret';
    appService.getAppInfo.mockResolvedValue({ id: 'appA', secrets: { 'meta.app_secret': 'app-secret' } });
    await expect(
      controller.webhook('appA', body, { rawBody } as any, sign(rawBody, 'env-secret')),
    ).rejects.toMatchObject({ code: 'E_META_SIGNATURE' });
    await controller.webhook('appA', body, { rawBody } as any, sign(rawBody, 'app-secret'));
    expect(leadService.storeLead).toHaveBeenCalledTimes(1);
  });

  it('refuses when the raw body was not captured', async () => {
    config.META_APP_SECRET = 'env-secret';
    await expect(controller.webhook('appA', body, {} as any, sign(rawBody, 'env-secret'))).rejects.toMatchObject({
      code: 'E_META_SIGNATURE',
    });
  });
});
