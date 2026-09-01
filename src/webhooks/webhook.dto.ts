import { IsString, IsObject } from 'class-validator';

export class WebhookTriggerDto {
  @IsString()
  event: string;

  @IsObject()
  data: Record<string, any>;

  @IsString()
  appId: string;
}
