import { CorsOptionsDelegate, CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { fromUrl, parseDomain, ParseResultType } from 'parse-domain';
import { AppService } from './app/app.service';

const corsOptionDelegate = async (
  req: any,
  callback: (error: Error | null, options: CorsOptions) => void,
  app: NestExpressApplication,
): Promise<CorsOptionsDelegate<any>> => {
  const host = req.headers['host'];
  const origin = req.headers['origin'] || '';

  if (!host || !origin) {
    callback(null, { credentials: false, origin: false });
    return;
  }

  const appService = app.get(AppService);

  const hostParseResult = parseDomain(host);
  const originParseResult = parseDomain(fromUrl(origin));

  const hostDomain =
    hostParseResult.type === ParseResultType.Listed &&
    `${hostParseResult.icann.domain}.${hostParseResult.icann.topLevelDomains.join('.')}`;
  const originDomain =
    originParseResult.type === ParseResultType.Listed &&
    `${originParseResult.icann.domain}.${originParseResult.icann.topLevelDomains.join('.')}`;

  // Local and tunnel origins are a development convenience and are not granted in production.
  const isProduction = process.env.NODE_ENV === 'production';
  const originHostname = new URL(origin).hostname;
  const isDevOrigin = originHostname === 'localhost' || originHostname.includes('ngrok');

  if ((!isProduction && isDevOrigin) || host.startsWith('localhost') || hostDomain === originDomain) {
    console.log('[CORS-INFO] CORS allowed: localhost or matching domain.', { host, origin });
    callback(null, { credentials: true, origin: true });
    return;
  }

  let allowedDomains = [];
  try {
    const { settings } = await appService.getAppInfoByHost(new URL(origin).hostname);
    allowedDomains = JSON.parse(settings['cors_allowed_domains'] || '[]');
  } catch (error) {
    console.log('[CORS-INFO] GetAppInfoByHost Error:', error);
    allowedDomains = [];
  }

  if (allowedDomains.includes(new URL(origin).hostname)) {
    console.log('[CORS-INFO] CORS allowed: Origin is in allowed domains.', { origin, allowedDomains });
    callback(null, { credentials: true, origin: true });
    return;
  }

  console.log('[CORS-INFO] CORS validation failed: Origin not allowed.', { host, origin, allowedDomains });
  callback(null, { credentials: false, origin: false });
};

export default corsOptionDelegate;
