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

  /**
   * Add a log message to the buffer and immediately publish it
   */
  async addLog(message: string, type: "log" | "error" = "log"): Promise<void> {
    const logMessage: LogMessage = {
      type,
      message,
      timestamp: Date.now()
    };

    this.logs.push(logMessage);

    // Publish immediately to Redis
    await this.pubSub.publish(this.channel, JSON.stringify({
      type: "log",
      data: logMessage
    }));
  }

  /**
   * Publish test results
   */
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

  /**
   * Get all accumulated logs
   */
  getLogs(): LogMessage[] {
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}
