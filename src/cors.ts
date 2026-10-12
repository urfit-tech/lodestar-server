import { CorsOptionsDelegate, CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { parseDomain, ParseResultType } from 'parse-domain';
import { AppService } from './app/app.service';

// The app lookups needed to decide which origins a request host trusts. Every lookup is keyed by
// the request host (or its app); nothing is ever looked up by the Origin.
export type RequestHostAppLookup = Pick<AppService, 'getAppInfoByHost' | 'getAppHostNames'>;

export type OriginTrust =
  | 'same-host'
  | 'app-host'
  | 'allowed-domain'
  | 'development'
  | 'no-origin'
  | 'invalid-origin'
  | 'invalid-host'
  | 'other'
  | 'lookup-failed';

const isProduction = () => process.env.NODE_ENV === 'production';

const normalizeHostname = (hostname: string) => hostname.toLowerCase().replace(/\.+$/, '');

// Registrable domain (for example `taotaoxi.net` or `example.com.tw`). Undefined when the hostname is not Listed.
export const registrableDomain = (hostname: string): string | undefined => {
  const result = parseDomain(hostname);
  if (result.type !== ParseResultType.Listed || !result.icann.domain) {
    return undefined;
  }
  return `${result.icann.domain}.${result.icann.topLevelDomains.join('.')}`;
};

// The request Host header without its port. Undefined when it is missing or not a plain host name.
export const requestHostname = (rawHost: string | undefined): string | undefined => {
  if (!rawHost || !/^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(rawHost)) {
    return undefined;
  }
  const hostname = normalizeHostname(rawHost.split(':')[0]);
  return hostname || undefined;
};

// The Origin's hostname, or undefined when the Origin is not a web origin this environment accepts.
// Production accepts only https origins on the default port.
export const originHostname = (origin: string | undefined): string | undefined => {
  if (!origin) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return undefined;
  }
  if (isProduction()) {
    if (url.protocol !== 'https:' || url.port !== '') {
      return undefined;
    }
  } else if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return undefined;
  }
  const hostname = normalizeHostname(url.hostname);
  return hostname || undefined;
};

// Local and tunnel origins, and local hosts, are a development convenience; never in production.
const isDevelopmentException = (originHost: string, host: string | undefined) => {
  if (isProduction()) {
    return false;
  }
  return originHost === 'localhost' || originHost.includes('ngrok') || !!host?.startsWith('localhost');
};

const parseAllowedDomains = (value: string | undefined): string[] => {
  const parsed = JSON.parse(value || '[]');
  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is string => typeof entry === 'string').map(normalizeHostname)
    : [];
};

// An origin is trusted for credentialed requests only when it is the request host itself, another host
// of the request host's app on the same registrable domain, or listed in the request host's app
// `cors_allowed_domains` setting. Lookup failures are not trusted.
export const evaluateOrigin = async (
  origin: string | undefined,
  rawHost: string | undefined,
  lookup: RequestHostAppLookup,
): Promise<{ trusted: boolean; reason: OriginTrust }> => {
  if (origin === undefined || origin === '') {
    return { trusted: false, reason: 'no-origin' };
  }
  const originHost = originHostname(origin);
  if (originHost === undefined) {
    return { trusted: false, reason: 'invalid-origin' };
  }
  const host = requestHostname(rawHost);
  if (isDevelopmentException(originHost, host)) {
    return { trusted: true, reason: 'development' };
  }
  if (host === undefined) {
    return { trusted: false, reason: 'invalid-host' };
  }
  if (originHost === host) {
    return { trusted: true, reason: 'same-host' };
  }

  try {
    const appCache = await lookup.getAppInfoByHost(host);
    if (parseAllowedDomains(appCache.settings?.['cors_allowed_domains']).includes(originHost)) {
      return { trusted: true, reason: 'allowed-domain' };
    }
    const originSite = registrableDomain(originHost);
    if (originSite === undefined || originSite !== registrableDomain(host)) {
      return { trusted: false, reason: 'other' };
    }
    const appHosts = (await lookup.getAppHostNames(appCache.id)).map(normalizeHostname);
    if (appHosts.includes(originHost)) {
      return { trusted: true, reason: 'app-host' };
    }
    return { trusted: false, reason: 'other' };
  } catch {
    return { trusted: false, reason: 'lookup-failed' };
  }
};

// For log lines: the Origin's registrable domain only.
export const describeOriginSite = (origin: string | undefined) => {
  if (origin === undefined) {
    return '-';
  }
  if (origin === 'null') {
    return 'null';
  }
  let hostname: string;
  try {
    hostname = normalizeHostname(new URL(origin).hostname);
  } catch {
    return 'invalid';
  }
  return registrableDomain(hostname) || 'invalid';
};

export const describeRequestHost = (rawHost: string | undefined) => requestHostname(rawHost) || 'invalid';

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
    // Responses differ by Origin whether or not the origin is granted.
    req.res?.vary?.('Origin');
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
  const rawHost: string | undefined = req.headers['host'];
  const origin: string | undefined = req.headers['origin'] || undefined;

  if (!rawHost || !origin) {
    callback(deny());
    return;
  }

  const { trusted, reason } = await evaluateOrigin(origin, rawHost, app.get(AppService));
  if (trusted) {
    console.log(
      `[CORS-INFO] cors-allow reason=${reason} origin_host=${originHostname(origin)} host=${describeRequestHost(
        rawHost,
      )}`,
    );
    callback({ credentials: true, origin: true });
    return;
  }

  console.log(
    `[CORS-INFO] cors-reject reason=${reason} origin_site=${describeOriginSite(origin)} host=${describeRequestHost(
      rawHost,
    )}`,
  );
  callback(deny());
};

export default corsOptionDelegate;
