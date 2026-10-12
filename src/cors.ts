import { CorsOptionsDelegate, CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { fromUrl, parseDomain, ParseResultType } from 'parse-domain';
import { AppService } from './app/app.service';

const deny = (): CorsOptions => ({ credentials: false, origin: false });

const corsOptionDelegate = async (
  req: any,
  callback: (error: Error | null, options: CorsOptions) => void,
  app: NestExpressApplication,
): Promise<CorsOptionsDelegate<any>> => {
  let answered = false;
  const respond = (options: CorsOptions) => {
    answered = true;
    callback(null, options);
  };
  try {
    await evaluateCors(req, respond, app);
  } catch (error) {
    console.log('[CORS-INFO] CORS evaluation failed: Origin not allowed.', { error: error?.message });
    if (!answered) {
      respond(deny());
    }
  }
  return;
};

const evaluateCors = async (
  req: any,
  callback: (options: CorsOptions) => void,
  app: NestExpressApplication,
): Promise<void> => {
  const host = req.headers['host'];
  const origin = req.headers['origin'] || '';

  if (!host || !origin) {
    callback(deny());
    return;
  }

  // An Origin that is not a valid URL (for example `null`) is never granted.
  let originHostname: string;
  try {
    originHostname = new URL(origin).hostname;
  } catch {
    console.log('[CORS-INFO] CORS validation failed: Origin is not a valid URL.', { host, origin });
    callback(deny());
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
  const isDevOrigin = originHostname === 'localhost' || originHostname.includes('ngrok');

  if ((!isProduction && isDevOrigin) || host.startsWith('localhost') || hostDomain === originDomain) {
    console.log('[CORS-INFO] CORS allowed: localhost or matching domain.', { host, origin });
    callback({ credentials: true, origin: true });
    return;
  }

  let allowedDomains = [];
  try {
    const { settings } = await appService.getAppInfoByHost(originHostname);
    allowedDomains = JSON.parse(settings['cors_allowed_domains'] || '[]');
  } catch (error) {
    console.log('[CORS-INFO] GetAppInfoByHost Error:', error);
    allowedDomains = [];
  }

  if (allowedDomains.includes(originHostname)) {
    console.log('[CORS-INFO] CORS allowed: Origin is in allowed domains.', { origin, allowedDomains });
    callback({ credentials: true, origin: true });
    return;
  }

  console.log('[CORS-INFO] CORS validation failed: Origin not allowed.', { host, origin, allowedDomains });
  callback(deny());
};

export default corsOptionDelegate;
