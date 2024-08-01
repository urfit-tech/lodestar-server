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
    console.log(`[CORS-INFO] [${new Date().toISOString()}] CORS validation failed: Missing host or origin.`, {
      host,
      origin,
    });
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

  if (
    new URL(origin).hostname === 'localhost' ||
    new URL(origin).hostname.includes('ngrok') ||
    host.startsWith('localhost') ||
    hostDomain === originDomain
  ) {
    console.log(
      `[CORS-INFO] [${new Date().toISOString()}] CORS allowed: Origin is localhost, ngrok, or matching domain.`,
      { host, origin },
    );
    callback(null, { credentials: true, origin: true });
    return;
  }

  let allowedDomains = [];
  try {
    const { settings } = await appService.getAppInfoByHost(new URL(origin).hostname);
    allowedDomains = JSON.parse(settings['cors_allowed_domains'] || '[]');
  } catch (error) {
    console.error(
      `[CORS-ERROR] [${new Date().toISOString()}] Error retrieving allowed domains from app service:`,
      error,
    );
    allowedDomains = [];
  }

  if (allowedDomains.includes(new URL(origin).hostname)) {
    console.log(`[CORS-INFO] [${new Date().toISOString()}] CORS allowed: Origin is in allowed domains.`, {
      origin,
      allowedDomains,
    });
    callback(null, { credentials: true, origin: true });
    return;
  }

  console.warn(`[CORS-WARN] [${new Date().toISOString()}] CORS validation failed: Origin not allowed.`, {
    host,
    origin,
    allowedDomains,
  });
  callback(null, { credentials: false, origin: false });
};

export default corsOptionDelegate;
