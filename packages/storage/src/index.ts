import {
  CreateUploadUrlParams,
  CreateUploadUrlResult,
  ObjectStoreProvider,
} from "./objectStoreProtocol.js";
import { StorageConfigMap } from "./types.js";
import { S3Provider } from "./s3.js";
import { GCSProvider } from "./gcs.js";

type ProviderFactoryMap = {
  [K in keyof StorageConfigMap]: (config: StorageConfigMap[K]) => ObjectStoreProvider;
};

const providerRegistry: ProviderFactoryMap = {
  s3: (config) => new S3Provider(config),
  gcs: (config) => new GCSProvider(config),
};

let storageProvider: ObjectStoreProvider | null = null;

export function initStorage<K extends keyof StorageConfigMap>(
  provider: K,
  config: StorageConfigMap[K],
) {
  const factory = providerRegistry[provider];
  storageProvider = factory(config);
}

function getStorage(): ObjectStoreProvider {
  if (!storageProvider) {
    throw new Error("Storage not initialized. Call initStorage() from backend first.");
  }
  return storageProvider;
}

export async function createUploadUrl(
  params: CreateUploadUrlParams,
): Promise<CreateUploadUrlResult> {
  return getStorage().createUploadUrl(params);
}

export function getDownloadUrl(key: string): string {
  return getStorage().getDownloadUrl(key);
}