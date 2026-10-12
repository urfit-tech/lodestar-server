import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { APIException } from '~/api.excetion';
import { AppService } from '~/app/app.service';
import { describeOriginSite, describeRequestHost, evaluateOrigin, RequestHostAppLookup } from '~/cors';

type RequestHeaders = Record<string, string | string[] | undefined>;

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const headerValue = (headers: RequestHeaders, name: string): string | undefined => {
  const value = headers[name];
  return Array.isArray(value) ? value.join(', ') : value;
};

const fetchSiteValues = (headers: RequestHeaders) =>
  (headerValue(headers, 'sec-fetch-site') || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

// A request is accepted when it carries no Origin (server to server, native apps) and is not marked
// `Sec-Fetch-Site: cross-site`, or when its Origin is trusted by the request host under the same rules as
// credentialed CORS (src/cors.ts). Lookup failures count as cross-site.
export const isCrossSiteRequest = async (headers: RequestHeaders, lookup: RequestHostAppLookup): Promise<boolean> => {
  if (fetchSiteValues(headers).includes('cross-site')) {
    return true;
  }
  const origin = headerValue(headers, 'origin');
  if (origin === undefined) {
    return false;
  }
  const { trusted } = await evaluateOrigin(origin, headerValue(headers, 'host'), lookup);
  return !trusted;
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

// Session endpoints accept state-changing requests only from origins the request host trusts.
@Injectable()
export class SameSiteRequestGuard implements CanActivate {
  private readonly logger = new Logger(SameSiteRequestGuard.name);

  constructor(private readonly appService: AppService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.includes(request.method)) {
      return true;
    }
    let crossSite = true;
    try {
      crossSite = await isCrossSiteRequest(request.headers, this.appService);
    } catch {
      crossSite = true;
    }
    if (!crossSite) {
      return true;
    }

    const route = (request.originalUrl || request.url || '').split('?')[0].slice(0, 200);
    this.logger.warn(
      `cross-site-auth-reject route=${route} origin_site=${describeOriginSite(
        headerValue(request.headers, 'origin'),
      )} host=${describeRequestHost(headerValue(request.headers, 'host'))} sfs=${describeFetchSite(request.headers)}`,
    );
    throw new APIException(crossSiteRejectedBody, 403);
  }
}
