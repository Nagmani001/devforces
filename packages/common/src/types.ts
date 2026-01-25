export interface PAYLOAD_TO_PUSH {
  id: string,
  challengeId: string,
  url: string
}


export interface PAYLOAD_TO_RECEIVE {
  passed: number,
  total: number,
  failed: number
}

export interface LogMessage {
  type: "log" | "result" | "error";
  message: string;
  timestamp: number;
}

export interface SSEMessage {
  type: "log" | "result";
  data: LogMessage;
}


export type Challenge = {
  id: string;
  title: string;
  notionLink: string;
  baseGithubUrl: string;
  testFile: string;
  totalTestCases: number | "";
};

export type Contest = {
  id?: string,
  title: string,
  subtitle: string,
  duration: number,
  startsAt: Date,
  challenges: Challenge[]
}
