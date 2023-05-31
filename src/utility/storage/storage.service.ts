import {
  S3,
  ListObjectsV2Request,
  GetObjectRequest,
  GetObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly awsS3AccessKeyId: string;
  private readonly awsS3SecretAccessKey: string;
  private readonly awsS3BucketStatic: string;
  private readonly awsS3BucketStorage: string;

  constructor(
    private readonly configService: ConfigService<{
      AWS_S3_ACCESS_KEY_ID: string;
      AWS_S3_SECRET_ACCESS_KEY: string;
      AWS_S3_BUCKET_STATIC: string;
      AWS_S3_BUCKET_STORAGE: string;
    }>,
  ) {
    this.awsS3AccessKeyId = configService.getOrThrow('AWS_S3_ACCESS_KEY_ID');
    this.awsS3SecretAccessKey = configService.getOrThrow('AWS_S3_SECRET_ACCESS_KEY');
    this.awsS3BucketStatic = configService.getOrThrow('AWS_S3_BUCKET_STATIC');
    this.awsS3BucketStorage = configService.getOrThrow('AWS_S3_BUCKET_STORAGE');
  }

  private s3(): S3 {
    return new S3({
      credentials: {
        accessKeyId: this.awsS3AccessKeyId,
        secretAccessKey: this.awsS3SecretAccessKey,
      },
    });
  }

  getSignedUrlForDownloadStorage(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Key: key,
      Bucket: this.awsS3BucketStorage,
    })
    return getSignedUrl(this.s3(), command, { expiresIn });
  }

  saveFilesInBucketStorage(data: Omit<PutObjectCommandInput, 'Bucket'>) {
    return this.saveFileToBucket({
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  listFilesInBucketStorage(data: Omit<ListObjectsV2Request, 'Bucket'>) {
    return this.listFilesInBucket({
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  getFileFromBucketStorage(data: Omit<GetObjectRequest, 'Bucket'>) {
    return this.getFileFromBucket({
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  private async getFileFromBucket(data: GetObjectCommandInput) {
    return this.s3().getObject(data);
  }

  private async saveFileToBucket(data: PutObjectCommandInput) {
    return this.s3().putObject(data);
  }

  private listFilesInBucket(data: ListObjectsV2CommandInput) {
    return this.s3().listObjectsV2(data);
  }
}
