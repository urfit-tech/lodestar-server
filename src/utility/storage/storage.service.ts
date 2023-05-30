import aws from 'aws-sdk';
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

  private s3(): aws.S3 {
    return new aws.S3({
      accessKeyId: this.awsS3AccessKeyId,
      secretAccessKey: this.awsS3SecretAccessKey,
    });
  }

  signedBucketStaticUrl(operation: string, params: any): string {
    return this.signedUrl(this.awsS3BucketStatic, operation, params);
  }

  signedBucketStorageUrl(operation: string, params: any): string {
    return this.signedUrl(this.awsS3BucketStorage, operation, params);
  }

  listFilesInBucketStorage(data: Omit<aws.S3.ListObjectsV2Request, 'Bucket'>) {
    return this.listFilesInBucket({
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  getFileFromBucketStorage(data: Omit<aws.S3.GetObjectRequest, 'Bucket'>) {
    return this.getFileFromBucket({
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  private async getFileFromBucket(data: aws.S3.Types.GetObjectRequest) {
    return this.s3().getObject(data).promise();
  }

  private async saveFileToBucket(data: aws.S3.Types.PutObjectRequest) {
    return this.s3().putObject(data).promise();
  }

  private listFilesInBucket(data: aws.S3.ListObjectsV2Request) {
    return this.s3().listObjectsV2(data).promise();
  }

  private signedUrl(
    bucket: string, operation: string, params: any,
  ): string {
    return this.s3().getSignedUrl(operation, {
      ...params,
      Bucket: bucket,
    });
  }
}
