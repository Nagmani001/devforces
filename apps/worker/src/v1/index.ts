import { config } from "dotenv";
config();

import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { createClient, RedisClientType } from "redis";
import util from "util";
import { exec as execCb } from "child_process";
import path from "path";
import prisma from "@repo/db/client";
import { downloadAndUnzipFile, WORK_DIR } from "./lib/utils";
import { LogsManager } from "./lib/logsManager";
import {
  buildImage,
  lookupBackendPort,
  projectName,
  sanitizeComposeFile,
  startContainers,
  stopAndRemoveContainers,
} from "./lib/compose";
import { prepareTestFile, runTests, waitForHealth } from "./lib/testRunner";

const exec = util.promisify(execCb);

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

  while (true) {
    const popped = await redisClient.brPop(REDIS_QUEUE_NAME, 0);
    const startTime = new Date().getTime();
    const { id, challengeId, url } = JSON.parse(popped?.element!);

    const logsManager = new LogsManager(pubSub, id);
    const project = projectName(id);
    const resultsJsonPath = path.join(WORK_DIR, `vitest-${id}.json`);

    await logsManager.addLog(" Starting submission processing...");
    await logsManager.addLog(` Submission ID: ${id}`);
    await logsManager.addLog(` Challenge ID: ${challengeId}`);
    await logsManager.addLog(` Downloading submission from: ${url}`);

    const projectPath = await downloadAndUnzipFile(url, id, logsManager);
    await logsManager.addLog(` Project extracted successfully: ${projectPath}`);

    await sanitizeComposeFile(projectPath);

    await logsManager.addLog(
      " Building Docker container (this may take a few minutes)...",
    );
    await logsManager.addLog(" Step 1/2: Building Docker image...");
    await buildImage(projectPath, project, logsManager);
    await logsManager.addLog(" Docker image built successfully");

    await logsManager.addLog(" Step 2/2: Starting Docker containers...");
    await startContainers(projectPath, project, logsManager);
    await logsManager.addLog(" Docker containers started successfully");

    const backendHostPort = await lookupBackendPort(projectPath, project);
    await logsManager.addLog(
      ` Backend exposed on host port ${backendHostPort}`,
    );

    const testFile = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
      },
      select: {
        testFile: true,
        totalTestCases: true,
      },
    });
    if (!testFile) {
      await logsManager.addLog(
        " Error: Test file not found for challenge",
        "error",
      );
      throw new Error("Test file not found");
    }

    await logsManager.addLog(
      ` Preparing test suite (${testFile.totalTestCases} test cases expected)`,
    );
    const testFilePath = await prepareTestFile(
      id,
      testFile.testFile,
      backendHostPort,
    );
    await logsManager.addLog(" Test file written successfully");

    await logsManager.addLog(
      " Waiting for service to be ready (health check)...",
    );
    const numberOfErrors = await waitForHealth(backendHostPort, logsManager);

    try {
      const { result, executionExitedNonZero } = await runTests(
        testFilePath,
        resultsJsonPath,
        testFile.totalTestCases,
        logsManager,
      );
      await logsManager.publishResult(result);
      try {
        await exec(`rm -f "${resultsJsonPath}"`);
      } catch {}
    } catch (fatalErr: any) {
      console.log("fatal err", fatalErr);
      await logsManager.addLog(
        " Test execution encountered a fatal error",
        "error",
      );
      await logsManager.publishResult({
        passed: 0,
        total: testFile.totalTestCases,
        failed: testFile.totalTestCases,
      });
    } finally {
      await logsManager.addLog(" Cleaning up resources...");
      await logsManager.addLog("   Stopping Docker containers...");

      try {
        await stopAndRemoveContainers(projectPath, project);
        await logsManager.addLog("   Docker containers stopped and removed");
      } catch (cleanupErr) {
        await logsManager.addLog(
          "     Warning: Some Docker cleanup steps may have failed",
          "error",
        );
      }

      await logsManager.addLog("   Removing temporary files...");
      try {
        const extractedDir = path.join(WORK_DIR, "extracted");
        const zipFile = path.join(WORK_DIR, `${id}.zip`);
        await exec(`rm -rf "${extractedDir}" "${zipFile}" "${testFilePath}"`);
        await logsManager.addLog("    Temporary files cleaned up");
      } catch (cleanupErr) {
        await logsManager.addLog(
          "     Warning: Some file cleanup steps may have failed",
          "error",
        );
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

      if (numberOfErrors > 0) {
        await logsManager.addLog(`ℹ️  Health check retries: ${numberOfErrors}`);
      }

      await logsManager.addLog(" Submission processing completed");
    }
  }
}

if (require.main === module) {
  main();
}
