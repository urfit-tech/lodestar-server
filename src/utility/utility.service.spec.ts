import { Test, TestingModule } from '@nestjs/testing';
import { UtilityService } from './utility.service';
import { Readable } from 'stream';

jest.mock('crypto', () => {
  const originalModule = jest.requireActual('crypto');
  return {
    ...originalModule,
    createCipheriv: jest.fn().mockImplementation(() => {
      return {
        update: jest.fn().mockImplementation(() => {
          throw new Error('Test Error');
        }),
        final: jest.fn(),
      };
    }),
  };
});

describe('UtilityService', () => {
  let service: UtilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilityService],
    }).compile();

    service = module.get<UtilityService>(UtilityService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle errors in encryptDataStream', (done) => {
    const dataStream = new Readable({
      read() {
        this.push('valid data');
        this.push(null);
      },
    });

    const key = 'some-key';
    const iv = 'some-iv';

    process.env.PBKDF2_ITERATIONS = '10000';
    process.env.ENCRYPT_DATA_STREAM_SALT = 'some-salt';

    const encryptedStream = service.encryptDataStream(dataStream, key, iv);

    encryptedStream.on('error', (err) => {
      expect(err).toBeDefined();
      done();
    });

    encryptedStream.on('data', (data) => {
      fail('Encrypted stream should not emit "data" event on error');
    });

    encryptedStream.on('end', () => {
      fail('Encrypted stream should not emit "end" event on error');
    });
  });
});
