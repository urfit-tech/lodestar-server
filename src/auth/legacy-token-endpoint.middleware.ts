import { RequestHandler, Response } from 'express';
import { parse } from 'url';

export const retiredTokenEndpointBody = {
  code: 'E_AUTH_TOKEN',
  message: 'this endpoint has been retired',
  result: null,
};

export function sendRetiredTokenEndpoint(response: Response) {
  response.setHeader('Cache-Control', 'no-store');
  return response.status(503).json(retiredTokenEndpointBody);
}

// Matches only the retired route, including Express path aliases (case, duplicate
// and trailing slashes). The request URL is left untouched and no other route is affected.
export const legacyTokenEndpointMiddleware: RequestHandler = (request, response, next) => {
  const pathname = (parse(request.originalUrl).pathname || '').replace(/\/+/g, '/').replace(/\/$/, '').toLowerCase();
  if (request.method === 'POST' && (pathname === '/api/v1/auth/token' || pathname === '/api/v2/auth/token')) {
    return sendRetiredTokenEndpoint(response);
  }
  return next();
};
