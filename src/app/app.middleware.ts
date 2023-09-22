import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';

import { AppService } from './app.service';
import { AppCache } from './app.type';

@Injectable()
export class AppMiddleware implements NestMiddleware {
  constructor(
    private readonly appService: AppService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (!host) {
      return res.status(500).json({
        message: 'cannot retrieve host in the header',
      });
    }

    this.appService.getAppInfoByHost(host)
      .then((appCache: AppCache) => {
        res.locals.appCache = appCache;
        next();
        this.appService.setAppCache(host, appCache);
      })
      .catch((error) => {
        return res.status(500).json({
          message: `cannot get the app: ${error.message}`,
        });
      });
  }
}
