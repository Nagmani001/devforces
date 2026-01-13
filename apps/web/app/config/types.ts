
export interface signupType {
  username: string,
  password: string,
  email: string
}

export interface signinType {
  email: string,
  password: string
}



export interface getStatusOfContestReturns {
  status: string,
  startsAtMessage?: string
}



export interface S3PresignedPostFields {
  Policy: string;
  "X-Amz-Algorithm": string;
  "X-Amz-Credential": string;
  "X-Amz-Date": string;
  "X-Amz-Signature": string;
  bucket: string;
  key: string;
}
