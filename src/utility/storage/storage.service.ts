import {
  S3Client,
  ListObjectsV2Request,
  GetObjectRequest,
  GetObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommandInput,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandInput,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
  UploadPartCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly awsS3RegionStorage: string;
  private readonly awsS3RegionStatic: string;
  private readonly awsS3BucketStatic: string;
  private readonly awsS3BucketStorage: string;

  constructor(
    private readonly configService: ConfigService<{
      AWS_S3_BUCKET_STATIC: string;
      AWS_S3_REGION_STATIC: string;
      AWS_S3_REGION_STORAGE: string;
      AWS_S3_BUCKET_STORAGE: string;
    }>,
  ) {
    this.awsS3BucketStatic = configService.getOrThrow('AWS_S3_BUCKET_STATIC');
    this.awsS3RegionStatic = configService.getOrThrow('AWS_S3_REGION_STATIC');
    this.awsS3RegionStorage = configService.getOrThrow('AWS_S3_REGION_STORAGE');
    this.awsS3BucketStorage = configService.getOrThrow('AWS_S3_BUCKET_STORAGE');
  }

  private s3(region: string): S3Client {
    return new S3Client({ region });
  }

  getSignedUrlForUploadStorage(appId: string, key: string, expiresIn: number): Promise<string> {
    const command = new PutObjectCommand({
      Key: `${appId}/${key}`,
      Bucket: this.awsS3BucketStorage,
    });
    return getSignedUrl(this.s3(this.awsS3RegionStorage), command, { expiresIn });
  }

  getSignedUrlForDownloadStorage(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Key: key,
      Bucket: this.awsS3BucketStorage,
    });
    return getSignedUrl(this.s3(this.awsS3RegionStorage), command, { expiresIn });
  }

  saveFilesInBucketStorage(data: Omit<PutObjectCommandInput, 'Bucket'>) {
    return this.saveFileToBucket(this.awsS3RegionStorage, {
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  deleteFileAtBucketStorage(data: Omit<DeleteObjectCommandInput, 'Bucket'>) {
    return this.deleteFileAtBucket(this.awsS3RegionStorage, {
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  listFilesInBucketStorage(data: Omit<ListObjectsV2Request, 'Bucket'>) {
    return this.listFilesInBucket(this.awsS3RegionStorage, {
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  getFileFromBucketStorage(data: Omit<GetObjectRequest, 'Bucket'>) {
    return this.getFileFromBucket(this.awsS3RegionStorage, {
      ...data,
      Bucket: this.awsS3BucketStorage,
    });
  }

  async createMultipartUpload(params: Omit<CreateMultipartUploadCommandInput, 'Bucket'>) {
    const command = new CreateMultipartUploadCommand({ Bucket: this.awsS3BucketStorage, ...params });
    return this.s3(this.awsS3RegionStorage).send(command);
  }

  async completeMultipartUpload(params: Omit<CompleteMultipartUploadCommandInput, 'Bucket'>) {
    const command = new CompleteMultipartUploadCommand({ Bucket: this.awsS3BucketStorage, ...params });
    return this.s3(this.awsS3RegionStorage).send(command);
  }

  getSignedUrlForUploadPartStorage(params: Omit<UploadPartCommandInput, 'Bucket'>, expiresIn: number): Promise<string> {
    const command = new UploadPartCommand({ Bucket: this.awsS3BucketStorage, ...params });
    return getSignedUrl(this.s3(this.awsS3RegionStorage), command, { expiresIn });
  }

  private async getFileFromBucket(region: string, data: GetObjectCommandInput) {
    const command = new GetObjectCommand(data);
    return this.s3(region).send(command);
  }

  private async saveFileToBucket(region: string, data: PutObjectCommandInput) {
    const command = new PutObjectCommand(data);
    return this.s3(region).send(command);
  }

  private async deleteFileAtBucket(region: string, data: DeleteObjectCommandInput) {
    const command = new DeleteObjectCommand(data);
    return this.s3(region).send(command);
  }

  private listFilesInBucket(region: string, data: ListObjectsV2CommandInput) {
    const command = new ListObjectsV2Command(data);
    return this.s3(region).send(command);
  }
}
