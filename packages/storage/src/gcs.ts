import { Storage } from "@google-cloud/storage";
import {
  CreateUploadUrlParams,
  CreateUploadUrlResult,
  ObjectStoreProvider,
} from "./objectStoreProtocol.js";
import { GCSProviderConfig } from "./types.js";

export class GCSProvider extends ObjectStoreProvider {
  private storage: Storage;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(config: GCSProviderConfig) {
    super();
    this.bucket = config.bucket;
    this.publicBaseUrl =
      config.publicBaseUrl ?? `https://storage.googleapis.com/${config.bucket}`;
    this.storage = new Storage({
      ...(config.projectId ? { projectId: config.projectId } : {}),
      ...(config.keyFilename ? { keyFilename: config.keyFilename } : {}),
      ...(config.credentials ? { credentials: config.credentials } : {}),
    });
  }

  async createUploadUrl(params: CreateUploadUrlParams): Promise<CreateUploadUrlResult> {
    const file = this.storage.bucket(this.bucket).file(params.key);
    const contentType = params.contentType ?? "application/octet-stream";

    const [url] = await file.getSignedUrl({
      action: "write",
      version: "v4",
      expires: Date.now() + params.expiresInSeconds * 1000,
      contentType,
    });

    return {
      url,
      method: "PUT",
      headers: { "Content-Type": contentType },
    };
  }

  getDownloadUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}