import { CorsOptionsDelegate, CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { fromUrl, parseDomain, ParseResultType } from 'parse-domain';

const corsOptionDelegate: CorsOptionsDelegate<any> = (
  req: any,
  callback: (error: Error | null, options: CorsOptions) => void,
) => {
  const host = req.headers['host'];
  const origin = req.headers['origin'] || '';

  if (!host || !origin) {
    callback(null, { credentials: false, origin: false });
    return;
  }

  const hostParseResult = parseDomain(host);
  const originParseResult = parseDomain(fromUrl(origin));

  const hostDomain =
    hostParseResult.type === ParseResultType.Listed &&
    `${hostParseResult.icann.domain}.${hostParseResult.icann.topLevelDomains.join('.')}`;
  const originDomain =
    originParseResult.type === ParseResultType.Listed &&
    `${originParseResult.icann.domain}.${originParseResult.icann.topLevelDomains.join('.')}`;

  if (
    origin.includes('localhost') ||
    origin.includes('ngrok') ||
    host.startsWith('localhost') ||
    hostDomain === originDomain
  ) {
    callback(null, { credentials: true, origin: true });
    return;
  }

  callback(null, { credentials: false, origin: false });
};

export default corsOptionDelegate;
