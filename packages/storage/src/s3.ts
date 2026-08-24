import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  CreateUploadUrlParams,
  CreateUploadUrlResult,
  ObjectStoreProvider,
} from "./objectStoreProtocol.js";
import { S3ProviderConfig } from "./types.js";

export class S3Provider extends ObjectStoreProvider {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(config: S3ProviderConfig) {
    super();
    this.bucket = config.bucket;
    this.publicBaseUrl =
      config.publicBaseUrl ?? `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
    this.client = new S3Client({
      region: config.region,
      ...(config.accessKeyId && config.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            },
          }
        : {}),
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    });
  }

  async createUploadUrl(params: CreateUploadUrlParams): Promise<CreateUploadUrlResult> {
    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: params.key,
      Conditions: [["content-length-range", 0, params.maxSizeBytes]],
      Expires: params.expiresInSeconds,
      Fields: params.contentType ? { "Content-Type": params.contentType } : undefined,
    });

    return { url, method: "POST", fields };
  }

  getDownloadUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}