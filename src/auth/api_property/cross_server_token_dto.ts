import { ApiProperty } from '@nestjs/swagger';

export default class CrossServerTokenDTOProperty {
  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Key' })
  key: string;

  @ApiProperty({ description: 'List of Permissions', type: [String] })
  permissions: Array<string>;
}
