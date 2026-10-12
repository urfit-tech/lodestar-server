import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { parseDomain, ParseResultType } from 'parse-domain';
import { APIException } from '~/api.excetion';

type RequestHeaders = Record<string, string | string[] | undefined>;

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const headerValue = (headers: RequestHeaders, name: string): string | undefined => {
  const value = headers[name];
  return Array.isArray(value) ? value.join(', ') : value;
};

// Registrable domain (for example `taotaoxi.net` or `example.com.tw`), using the same
// parse-domain rules as the CORS configuration. Undefined when the hostname is not Listed.
const registrableDomain = (hostname: string): string | undefined => {
  const result = parseDomain(hostname);
  if (result.type !== ParseResultType.Listed || !result.icann.domain) {
    return undefined;
  }
  return `${result.icann.domain}.${result.icann.topLevelDomains.join('.')}`;
};

const hostnameOf = (value: string): string | undefined => {
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
};

// Local and tunnel origins, and local hosts, as in the CORS configuration (src/cors.ts); never in production.
const isDevelopmentException = (originHostname: string | undefined, host: string | undefined) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (originHostname !== undefined && (originHostname === 'localhost' || originHostname.includes('ngrok'))) {
    return true;
  }
  return !!host && host.startsWith('localhost');
};

const fetchSiteValues = (headers: RequestHeaders) =>
  (headerValue(headers, 'sec-fetch-site') || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

export const isCrossSiteRequest = (headers: RequestHeaders): boolean => {
  const origin = headerValue(headers, 'origin');
  const host = headerValue(headers, 'host');

  if (fetchSiteValues(headers).includes('cross-site')) {
    return true;
  }

  if (origin === undefined) {
    return false;
  }
  const originHostname = hostnameOf(origin);
  if (isDevelopmentException(originHostname, host)) {
    return false;
  }
  if (origin === 'null' || originHostname === undefined) {
    return true;
  }
  const originSite = registrableDomain(originHostname);
  const hostHostname = host ? hostnameOf(`http://${host}`) : undefined;
  const hostSite = hostHostname !== undefined ? registrableDomain(hostHostname) : undefined;
  return originSite === undefined || hostSite === undefined || originSite !== hostSite;
};

const describeOriginSite = (origin: string | undefined) => {
  if (origin === undefined) {
    return '-';
  }
  if (origin === 'null') {
    return 'null';
  }
  const hostname = hostnameOf(origin);
  return (hostname !== undefined && registrableDomain(hostname)) || 'invalid';
};

const describeFetchSite = (headers: RequestHeaders) => {
  const value = headerValue(headers, 'sec-fetch-site');
  return value ? value.replace(/[^a-zA-Z0-9,-]/g, '').slice(0, 40) || 'invalid' : '-';
};

export const crossSiteRejectedBody = {
  code: 'E_CROSS_SITE',
  message: 'cross-site request rejected',
  result: null,
};

// Session endpoints accept state-changing requests only from the same registrable domain as the
// request host. Requests without Origin and without `Sec-Fetch-Site: cross-site` (server to
// server, native apps) are accepted.
@Injectable()
export class SameSiteRequestGuard implements CanActivate {
  private readonly logger = new Logger(SameSiteRequestGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.includes(request.method) || !isCrossSiteRequest(request.headers)) {
      return true;
    }

    const route = (request.originalUrl || request.url || '').split('?')[0].slice(0, 200);
    this.logger.warn(
      `cross-site-auth-reject route=${route} origin_site=${describeOriginSite(
        headerValue(request.headers, 'origin'),
      )} sfs=${describeFetchSite(request.headers)}`,
    );
    throw new APIException(crossSiteRejectedBody, 403);
  }
}
