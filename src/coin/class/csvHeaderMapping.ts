import { IsNotEmpty, IsString, ValidateIf, validateSync, ValidationError } from 'class-validator';

export class CoinCsvHeaderMapping {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  startedAt: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  endedAt: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  note: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  description: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  claimedAt: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  createdAt: string;

  public deserializeFromRaw(headerRow: Record<string, string>): [CoinCsvHeaderMapping, Array<ValidationError>] {
    for (const humanReadable in headerRow) {
      const codeReadable = headerRow[humanReadable];
      switch (codeReadable) {
        case 'email':
        case 'title':
        case 'amount':
        case 'startedAt':
        case 'endedAt':
        case 'note':
        case 'description':
        case 'claimedAt':
        case 'createdAt':
          this[codeReadable] = humanReadable;
          continue;
        default:
          undefined;
          continue;
      }
    }

    return [this, validateSync(this)];
  }
}
