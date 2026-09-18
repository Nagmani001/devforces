import { config } from "dotenv";
config();

import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { createClient, RedisClientType } from "redis";
import prisma from "@repo/db/client";
import { downloadAndUnzipFile } from "./lib/utils";
import { LogsManager } from "./lib/logsManager";
import {
  claimOrCreateSandbox,
  injectCode,
  releaseSandbox,
  restartApp,
  waitForAppHealth,
} from "./lib/sandbox";
import { runTests } from "./lib/testRunner";
import { startPoolReconciliation } from "./lib/pool";

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});
const pubSub: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

export async function main() {
  await redisClient.connect();
  console.log("Connected to redis");
  await pubSub.connect();
  console.log("Connected to pubSub");

  startPoolReconciliation();

  while (true) {
    const popped = await redisClient.brPop(REDIS_QUEUE_NAME, 0);
    const startTime = new Date().getTime();
    const { id, challengeId, url } = JSON.parse(popped?.element!);

    const logsManager = new LogsManager(pubSub, id);
    let podName: string | undefined;
    let podIp: string | undefined;
    let totalTestCases = 0;

    try {
      await logsManager.addLog(
        " Starting submission processing (warm pool)...",
      );
      await logsManager.addLog(` Submission ID: ${id}`);
      await logsManager.addLog(` Challenge ID: ${challengeId}`);

      const challenge = await prisma.challenge.findFirst({
        where: { id: challengeId },
        select: { testFile: true, totalTestCases: true },
      });
      if (!challenge) {
        throw new Error("Test file not found for challenge");
      }
      totalTestCases = challenge.totalTestCases;

      await logsManager.addLog(` Downloading submission from: ${url}`);
      const projectPath = await downloadAndUnzipFile(url, id, logsManager);
      await logsManager.addLog(
        ` Project extracted successfully: ${projectPath}`,
      );

      await logsManager.addLog(" Acquiring a warm sandbox pod...");
      const pod = await claimOrCreateSandbox(challengeId, logsManager);
      podName = pod.metadata!.name!;
      podIp = pod.status?.podIP;
      if (!podIp) {
        throw new Error(`Claimed pod ${podName} has no pod IP yet`);
      }
      await logsManager.addLog(` Claimed sandbox pod ${podName} (${podIp})`);

      await logsManager.addLog(" Injecting submission code...");
      await injectCode(podName, projectPath);
      await logsManager.addLog(" Code injected");

      await restartApp(podName);
      await logsManager.addLog(" App restarted");

      await logsManager.addLog(
        " Waiting for service to be ready (health check)...",
      );
      await waitForAppHealth(podIp, logsManager);

      const { result } = await runTests(
        podName,
        id,
        challenge.testFile,
        totalTestCases,
        logsManager,
      );
      await logsManager.publishResult(result);
    } catch (err: any) {
      console.error("Submission processing failed:", err);
      await logsManager.addLog(` Error: ${err?.message || err}`, "error");
      await logsManager.publishResult({
        passed: 0,
        total: totalTestCases,
        failed: totalTestCases,
      });
    } finally {
      await logsManager.addLog(" Cleaning up resources...");
      if (podName) {
        await logsManager.addLog("   Releasing sandbox pod...");
        try {
          await releaseSandbox(podName);
          await logsManager.addLog("   Pod returned to pool");
        } catch (cleanupErr) {
          await logsManager.addLog(
            "     Warning: pod release failed — it will be reaped by reconcile",
            "error",
          );
        }
      }

      const endTime = new Date().getTime();
      const totalTime = (endTime - startTime) / 1000;
      const minutes = Math.floor(totalTime / 60);
      const seconds = (totalTime % 60).toFixed(0);
      if (minutes > 0) {
        await logsManager.addLog(
          `  Total processing time: ${minutes}m ${seconds}s`,
        );
      } else {
        await logsManager.addLog(
          `  Total processing time: ${totalTime.toFixed(1)}s`,
        );
      }

      await logsManager.addLog(" Submission processing completed");
    }
  }
}
