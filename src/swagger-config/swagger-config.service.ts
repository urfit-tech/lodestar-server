// swagger-config.service.ts
import { Injectable } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

@Injectable()
export class SwaggerConfigService {
  public static setupSwagger(app: INestApplication, config: SwaggerConfigParams): void {
    const options = new DocumentBuilder()
      .setTitle(config.title)
      .setDescription(config.description)
      .setVersion(config.version);

    config.tags.forEach((tag) => options.addTag(tag));
    if (config.bearerAuth) {
      options.addBearerAuth();
    }

    const documentOptions = options.build();

    const document = SwaggerModule.createDocument(app, documentOptions, config.documentOptions);
    if (config.routeFilter) {
      this.filterRoutes(document, config.routeFilter);
    }

    SwaggerModule.setup(config.endpoint, app, document);
  }

  private static filterRoutes(document: OpenAPIObject, routeFilter: (path: string) => boolean) {
    Object.keys(document.paths).forEach((path) => {
      if (!routeFilter(path)) {
        delete document.paths[path];
      }
    });
  }
}

export interface SwaggerConfigParams {
  title: string;
  description?: string;
  version: string;
  tags: string[];
  bearerAuth?: boolean;
  endpoint: string;
  documentOptions?: SwaggerDocumentOptions;
  routeFilter?: (path: string) => boolean;
}
