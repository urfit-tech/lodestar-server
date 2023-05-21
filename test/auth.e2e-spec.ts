import { LoggerModule } from 'nestjs-pino';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { PostgresModule } from '~/database/postgres.module';
import { ApiExceptionFilter } from '~/api.filter';
import { AuthModule } from '~/auth/auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRootAsync({
          providers: [ConfigService],
          useFactory: (configService: ConfigService<{ NODE_ENV: string }>) => {
            const nodeEnv = configService.getOrThrow('NODE_ENV');
            return nodeEnv !== 'production' ? {
              pinoHttp: {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    ignore: 'pid,context,hostname',
                  },
                },
              },
            } : {};
          },
          inject: [ConfigService],
        }),
        PostgresModule.forRootAsync(),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalFilters(new ApiExceptionFilter());

    await app.init();
  });

  describe('/auth/token (POST)', () => {
    const route = '/auth/token';

    it('Should return E_NOT_FOUND error', async () => {
      const { body } = await request(app.getHttpServer())
        .post(route)
        .send({
          clientId: 'not_exists',
          key: 'not_exists',
          permissions: [],
        })
        .expect(400);
      
      expect(body).toStrictEqual({
        code: 'E_NOT_FOUND',
        message: 'client ID doesn\'t exist',
        result: null,
      });
    });

    // TODO:
    //   After Hasura containerize, build test set and uncomment code below.
    // it('Should return E_AUTH_TOKEN error', async () => {
    //   const { body } = await request(app.getHttpServer())
    //     .post('/auth/token')
    //     .send({
    //       clientId: 'not_exists',
    //       key: 'not_exists',
    //       permissions: [],
    //     })
    //     .expect(400);
      
    //   expect(body).toStrictEqual({
    //     code: 'E_AUTH_TOKEN',
    //     message: 'key is not authenticated',
    //     result: null,
    //   });
    // });

    // it('Should return authToken', async () => {
    //   const { body } = await request(app.getHttpServer())
    //     .post('/auth/token')
    //     .send({
    //       clientId: 'not_exists',
    //       key: 'not_exists',
    //       permissions: [],
    //     })
    //     .expect(200);
      
    //   const { authToken } = body;
    //   expect(body).toStrictEqual({
    //     code: 'SUCCESS',
    //     message: 'get auth token successfully',
    //     result: { authToken },
    //   });
    // });
  });
});