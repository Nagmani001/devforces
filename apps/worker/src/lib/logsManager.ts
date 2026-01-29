import { RedisClientType } from "redis";

export interface LogMessage {
  type: "log" | "result" | "error";
  message: string;
  timestamp: number;
}

export class LogsManager {
  private pubSub: RedisClientType;
  private channel: string;
  private logs: LogMessage[] = [];

  constructor(pubSub: RedisClientType, channel: string) {
    this.pubSub = pubSub;
    this.channel = channel;
  }

  async addLog(message: string, type: "log" | "error" = "log"): Promise<void> {
    const logMessage: LogMessage = {
      type,
      message,
      timestamp: Date.now()
    };

    this.logs.push(logMessage);

    await this.pubSub.publish(this.channel, JSON.stringify({
      type: "log",
      data: logMessage
    }));
  }

  async publishResult(result: {
    passed: number;
    total: number;
    failed: number;
  }): Promise<void> {
    const resultMessage: LogMessage = {
      type: "result",
      message: JSON.stringify(result),
      timestamp: Date.now()
    };

    await this.pubSub.publish(this.channel, JSON.stringify({
      type: "result",
      data: resultMessage
    }));
  }

  getLogs(): LogMessage[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}
