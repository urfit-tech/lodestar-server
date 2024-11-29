import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
  ValidationError,
} from 'class-validator';
import dayjs from 'dayjs';
import { parseDateStringFieldFromRaw, parseFieldFromRaw, parseNullableFieldFromRaw } from '~/utils';
import { CoinCsvHeaderMapping } from './csvHeaderMapping';

export class CsvRawCoin {
  @IsEmail(undefined, { always: true })
  @IsNotEmpty()
  email: string | null | undefined;

  @IsString()
  @IsNotEmpty()
  title: string | null | undefined;

  @IsNumberString()
  @IsNotEmpty()
  amount: string | null | undefined;

  @IsOptional()
  @Transform(({ value }) => (value ? dayjs(value).toISOString() : value))
  @IsDateString(undefined, { always: true })
  startedAt: string | null | undefined;

  @IsOptional()
  @Transform(({ value }) => (value ? dayjs(value).toISOString() : value))
  @IsDateString(undefined, { always: true })
  endedAt: string | null | undefined;

  @IsString()
  @IsOptional()
  note: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @Transform(({ value }) => (value ? dayjs(value).toISOString() : value))
  @IsDateString(undefined, { always: true })
  claimedAt: string | null | undefined;

  @IsOptional()
  @Transform(({ value }) => (value ? dayjs(value).toISOString() : value))
  @IsDateString(undefined, { always: true })
  createdAt: string | null | undefined;

  public deserializedFromCsvRawRow(
    header: CoinCsvHeaderMapping,
    row: Record<string, any>,
  ): [CsvRawCoin, Array<ValidationError>] {
    this.email = parseFieldFromRaw<string>(row[header.email]);
    this.title = parseFieldFromRaw<string>(row[header.title]);
    this.amount = parseFieldFromRaw<string>(row[header.amount]);
    this.startedAt = parseDateStringFieldFromRaw<string>(row[header.startedAt]);
    this.endedAt = parseDateStringFieldFromRaw<string>(row[header.endedAt]);
    this.note = parseNullableFieldFromRaw<string>(row[header.note]);
    this.description = parseNullableFieldFromRaw<string>(row[header.description]);
    this.claimedAt = parseDateStringFieldFromRaw<string>(row[header.claimedAt]);
    this.createdAt = parseDateStringFieldFromRaw<string>(row[header.createdAt]);
    return [this, validateSync(this)];
  }
}
