export interface CreateUploadUrlParams {
  key: string;
  contentType?: string;
  maxSizeBytes: number;
  expiresInSeconds: number;
}

export interface CreateUploadUrlResult {
  url: string;
  method: "POST" | "PUT";
  fields?: Record<string, string>;
  headers?: Record<string, string>;
}

export abstract class ObjectStoreProvider {
  abstract createUploadUrl(params: CreateUploadUrlParams): Promise<CreateUploadUrlResult>;
  abstract getDownloadUrl(key: string): string;
}