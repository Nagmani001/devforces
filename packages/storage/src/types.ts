export interface S3ProviderConfig {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  publicBaseUrl?: string;
}

export interface GCSProviderConfig {
  bucket: string;
  projectId?: string;
  keyFilename?: string;
  credentials?: {
    type?: string;
    project_id?: string;
    private_key_id?: string;
    private_key: string;
    client_email: string;
    client_id?: string;
    auth_uri?: string;
    token_uri?: string;
    auth_provider_x509_cert_url?: string;
    client_x509_cert_url?: string;
  };
  publicBaseUrl?: string;
}

export interface StorageConfigMap {
  s3: S3ProviderConfig;
  gcs: GCSProviderConfig;
}