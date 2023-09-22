import { IsObject, IsString } from 'class-validator';

import { IsNullable } from '~/decorator';

export class AppCache {
  @IsString()
  id: string;

  @IsString()
  @IsNullable()
  orgId: string | null;

  @IsString()
  host: string;

  @IsString()
  name: string;

  @IsObject()
  settings: Record<string, string>;

  @IsObject()
  secrets: Record<string, string>;

  @IsString({ each: true })
  modules: Array<string>;

  @IsString({ each: true })
  defaultPermissions: Array<string>;
}
