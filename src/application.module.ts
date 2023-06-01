import { cwd, env } from 'process';
import { LoggerModule } from 'nestjs-pino';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PostgresModule } from './database/postgres.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { MediaModule } from './media/media.module';
import { UtilityModule } from './utility/utility.module';
import { WebhookService } from './webhook/webhook.service';
import { WebhookModule } from './webhook/webhook.module';
@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService, WebhookService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${cwd()}/.env${env.NODE_ENV ? `.${env.NODE_ENV}` : ''}`,
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      useFactory: (configService: ConfigService<{ NODE_ENV: string }>) => {
        const nodeEnv = configService.getOrThrow('NODE_ENV');
        return nodeEnv !== 'production'
          ? {
              pinoHttp: {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    ignore: 'pid,context,hostname',
                  },
                },
              },
            }
          : {};
      },
      inject: [ConfigService],
    }),
    PostgresModule.forRootAsync(),
    // TypeOrmModule.forRoot(MongoDataSourceConfig),
    AuthModule,
    MemberModule,
    MediaModule,
    UtilityModule,
    // TriggerModule,
    WebhookModule,
  ],
})
export class ApplicationModule {}
