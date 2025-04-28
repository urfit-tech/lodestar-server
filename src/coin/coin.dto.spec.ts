import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CoinImportDTO, CoinImportResultDTO } from './coin.dto';

describe('CoinImportDTO', () => {
  it('Should validate successfully with valid data', async () => {
    const validData = {
      appId: 'testAppId',
      fileInfos: [
        { key: 'fileKey1', checksum: 'checksum1' },
        { key: 'fileKey2', checksum: 'checksum2' },
      ],
    };

    const dto = plainToInstance(CoinImportDTO, validData);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('Should fail validation if appId is missing', async () => {
    const invalidData = {
      fileInfos: [{ key: 'fileKey1', checksum: 'checksum1' }],
    };

    const dto = plainToInstance(CoinImportDTO, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('appId');
  });

  it('Should fail validation if fileInfos is not an array of FileInfo', async () => {
    const invalidData = {
      appId: 'testAppId',
      fileInfos: { key: 'fileKey1', checksum: 'checksum1' }, // Not an array
    };

    const dto = plainToInstance(CoinImportDTO, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileInfos');
  });

  it('Should fail validation if any FileInfo entry is missing key or checksum', async () => {
    const invalidData = {
      appId: 'testAppId',
      fileInfos: [
        { key: 'fileKey1' }, // Missing checksum
      ],
    };

    const dto = plainToInstance(CoinImportDTO, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    const fileInfoErrors = errors.find(error => error.property === 'fileInfos');
    expect(fileInfoErrors).toBeDefined();

    const fileInfoError = fileInfoErrors?.children?.[0];
    expect(fileInfoError).toBeDefined();

    const checksumError = fileInfoError?.children?.find(child => child.property === 'checksum');
    expect(checksumError).toBeDefined();
    expect(checksumError?.constraints).toHaveProperty('isString', 'checksum must be a string');
  });
});

describe('CoinImportResultDTO', () => {
  it('Should initialize with correct counts and errors', () => {
    const resultData = {
      toInsertCount: 10,
      insertedCount: 8,
      failedCount: 2,
      failedErrors: [{ message: 'Error 1' }, { message: 'Error 2' }],
    };

    const resultDto = new CoinImportResultDTO();
    Object.assign(resultDto, resultData);

    expect(resultDto.toInsertCount).toBe(10);
    expect(resultDto.insertedCount).toBe(8);
    expect(resultDto.failedCount).toBe(2);
    expect(resultDto.failedErrors).toEqual([{ message: 'Error 1' }, { message: 'Error 2' }]);
  });
});
