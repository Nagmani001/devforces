import { config } from "dotenv";
config();

import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { readFile, writeFile } from 'fs/promises';
import { createClient, RedisClientType } from "redis";
import util from "util";
const exec = util.promisify(require('child_process').exec);
const { spawn } = require('child_process');
import path from "path";
import prisma from "@repo/db/client";
import { downloadAndUnzipFile, WORK_DIR } from "./lib/utils";
import { LogsManager } from "./lib/logsManager";
import axios from "axios";

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL
});
const pubSub: RedisClientType = createClient({
  url: process.env.REDIS_URL
});


async function main() {
  await redisClient.connect();
  console.log("Connected to redis");
  await pubSub.connect();
  console.log("Connected to pubSub");

  while (true) {
    const popped = await redisClient.brPop(REDIS_QUEUE_NAME, 0);
    const startTime = new Date().getTime();
    const { id, challengeId, url } = JSON.parse(popped?.element!);

    const logsManager = new LogsManager(pubSub, id);

    await logsManager.addLog(" Starting submission processing...");

    await logsManager.addLog(` Submission ID: ${id}`);
    await logsManager.addLog(` Challenge ID: ${challengeId}`);
    await logsManager.addLog(` Downloading submission from: ${url}`);

    const projectPath = await downloadAndUnzipFile(url, id, logsManager);
    await logsManager.addLog(` Project extracted successfully: ${projectPath}`);

    // Sanitize the user's docker-compose.yml so concurrent submissions don't collide:
    //  - strip container_name (forces fixed names)
    //  - strip obsolete version field
    //  - rewrite "HOST:CONTAINER" port mappings to just "CONTAINER" so Docker
    //    auto-assigns a free host port (looked up later via `docker compose port`)
    const composePath = path.join(projectPath, 'docker-compose.yml');
    const composeContent = await readFile(composePath, 'utf-8');
    const sanitizedCompose = composeContent
      .replace(/^\s*container_name:.*$/gm, '')
      .replace(/^\s*version:.*$/gm, '')
      .replace(/(-\s*["']?)(\d+):(\d+)(["']?)/g, '$1$3$4');
    await writeFile(composePath, sanitizedCompose);

    const projectName = `devforces-${id}`;

    await logsManager.addLog(" Building Docker container (this may take a few minutes)...");

    // Build Docker container
    await logsManager.addLog(" Step 1/2: Building Docker image...");
    const buildResult = await exec(`cd "${projectPath}" && docker compose -p "${projectName}" build --no-cache`);

    // Log full build output
    const buildOutput = buildResult.stdout || buildResult.stderr || '';
    const buildLines = buildOutput.split('\n').filter((line: string) => line.trim());

    // Stream all build logs
    for (const line of buildLines) {
      if (line.trim()) {
        await logsManager.addLog(`   ${line.trim()}`);
      }
    }

    await logsManager.addLog(" Docker image built successfully");
    await logsManager.addLog(" Step 2/2: Starting Docker containers...");

    const upResult = await exec(`cd "${projectPath}" && docker compose -p "${projectName}" up -d`);
    const upOutput = upResult.stdout || upResult.stderr || '';

    // Log full container startup output
    const upLines = upOutput.split('\n').filter((line: string) => line.trim());
    for (const line of upLines) {
      if (line.trim()) {
        await logsManager.addLog(`   ${line.trim()}`);
      }
    }

    await logsManager.addLog(" Docker containers started successfully");

    // Look up the auto-assigned host port for the backend service
    const portLookup = await exec(`cd "${projectPath}" && docker compose -p "${projectName}" port backend 8000`);
    const portMatch = (portLookup.stdout || '').trim().match(/:(\d+)$/);
    if (!portMatch) {
      throw new Error(`Could not determine host port for backend service. Got: ${portLookup.stdout}`);
    }
    const backendHostPort = portMatch[1];
    await logsManager.addLog(` Backend exposed on host port ${backendHostPort}`);

    let numberOfErrors = 0;


    const testFile = await prisma.challenge.findFirst({
      where: {
        id: challengeId
      },
      select: {
        testFile: true,
        totalTestCases: true
      }
    });

    if (!testFile) {
      await logsManager.addLog(" Error: Test file not found for challenge", "error");
      throw new Error("Test file not found");
    }

    const testFilePath = path.join(WORK_DIR, "index.test.ts");
    await logsManager.addLog(` Preparing test suite (${testFile.totalTestCases} test cases expected)`);
    // Rewrite hardcoded localhost:8000 in the test file to use the dynamic host port
    const rewrittenTestFile = testFile.testFile.replace(
      /(localhost|127\.0\.0\.1):8000/g,
      `localhost:${backendHostPort}`
    );
    await writeFile(testFilePath, rewrittenTestFile);
    await logsManager.addLog(" Test file written successfully");
    await logsManager.addLog(" Waiting for service to be ready (health check)...");

    let healthCheckAttempts = 0;
    const maxHealthCheckAttempts = 30; // 30 attempts max

    while (true) {
      try {
        const healthResponse = await axios.get(`http://localhost:${backendHostPort}/health`, { timeout: 2000 });
        if (healthCheckAttempts > 0) {
          await logsManager.addLog(` Service is healthy (after ${healthCheckAttempts} attempt${healthCheckAttempts > 1 ? 's' : ''})`);
        } else {
          await logsManager.addLog(" Service is ready");
        }
        await logsManager.addLog(" Starting test execution...");
        break;
      } catch (err) {
        numberOfErrors++;
        healthCheckAttempts++;

        if (healthCheckAttempts >= maxHealthCheckAttempts) {
          await logsManager.addLog(` Service health check failed after ${maxHealthCheckAttempts} attempts`, "error");
          throw new Error("Service failed to become healthy");
        }

        if (healthCheckAttempts % 5 === 0) {
          await logsManager.addLog(` Still waiting for service... (attempt ${healthCheckAttempts}/${maxHealthCheckAttempts})`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
        continue;
      }
    }

    /*
    VJUDGE / CODEFORCES STYLE RANKING
    total_penalty = sigma(each_penalty(problem_i), for all SOLVED problem_i)
    each_penalty(p) = Number_of_Fail_Before_1st_AC * 20min + time_of_1st_AC_since_contest_start
    */

    let numberOfPassedTestCases = 0;
    let numberOfFailedTestCases = testFile.totalTestCases;
    const resultsJsonPath = path.join(WORK_DIR, `vitest-${id}.json`);
    let executionExitedNonZero = false;

    try {
      await logsManager.addLog(` Executing ${testFile.totalTestCases} test cases...`);
      // Use vitest JSON reporter — text-scraping the human summary is unreliable
      // (e.g. "1 failed" from "Test Files 1 failed" gets matched instead of the
      // real assertion count, and a missing summary made fallback math claim
      // every test passed). JSON file is written even on assertion failures.
      // Run vitest with two reporters: default (pretty UI streamed live to the
      // user) + json (written to file for reliable pass/fail counts).
      const vitestExitCode: number = await new Promise<number>((resolve) => {
        const child = spawn(
          'npx',
          [
            'vitest',
            'run',
            testFilePath,
            '--reporter=default',
            '--reporter=json',
            `--outputFile.json=${resultsJsonPath}`,
          ],
          { env: { ...process.env, FORCE_COLOR: '0', CI: 'true' } }
        );

        const stream = (buf: Buffer) => {
          const text = buf.toString('utf-8').replace(/\[[0-9;]*[A-Za-z]/g, '');
          for (const line of text.split('\n')) {
            if (line.length > 0) {
              // Fire and forget — preserve order via the queue inside logsManager
              logsManager.addLog(line);
            }
          }
        };
        child.stdout.on('data', stream);
        child.stderr.on('data', stream);
        child.on('close', (code: number | null) => resolve(code ?? 1));
        child.on('error', () => resolve(1));
      });

      console.log('vitest exit code', vitestExitCode);
      if (vitestExitCode !== 0) {
        executionExitedNonZero = true;
      }

      let parsed: any = null;
      try {
        parsed = JSON.parse(await readFile(resultsJsonPath, 'utf-8'));
      } catch {
        await logsManager.addLog(" Could not read vitest results — test file failed to load (server crash, import error, syntax error)", "error");
      }

      if (parsed && typeof parsed.numPassedTests === 'number') {
        numberOfPassedTestCases = parsed.numPassedTests;
        numberOfFailedTestCases = (parsed.numFailedTests || 0) + (parsed.numPendingTests || 0);
        const failNames: string[] = [];
        for (const tr of parsed.testResults || []) {
          for (const a of tr.assertionResults || []) {
            if (a.status === 'failed' && failNames.length < 5) {
              failNames.push(a.fullName || a.title);
            }
          }
        }
        for (const n of failNames) await logsManager.addLog(`   x ${n}`, "error");
      } else {
        // No parseable JSON — every test is failed. Never infer "all passed".
        numberOfPassedTestCases = 0;
        numberOfFailedTestCases = testFile.totalTestCases;
      }

      const result = {
        passed: numberOfPassedTestCases,
        total: testFile.totalTestCases,
        failed: numberOfFailedTestCases,
      };

      if (!executionExitedNonZero && numberOfPassedTestCases === testFile.totalTestCases && numberOfFailedTestCases === 0) {
        await logsManager.addLog(` All tests passed! (${numberOfPassedTestCases}/${testFile.totalTestCases})`);
      } else {
        await logsManager.addLog(`  Tests completed: ${numberOfPassedTestCases} passed, ${numberOfFailedTestCases} failed (${testFile.totalTestCases} total)`, "error");
      }

      await logsManager.publishResult(result);
      try { await exec(`rm -f "${resultsJsonPath}"`); } catch {}
    } catch (fatalErr: any) {
      console.log("fatal err", fatalErr);
      await logsManager.addLog(" Test execution encountered a fatal error", "error");
      await logsManager.publishResult({
        passed: 0,
        total: testFile.totalTestCases,
        failed: testFile.totalTestCases,
      });
    } finally {
      await logsManager.addLog(" Cleaning up resources...");
      await logsManager.addLog("   Stopping Docker containers...");

      try {
        await exec(`cd "${projectPath}" && docker compose -p "${projectName}" down --rmi all`);
        await logsManager.addLog("   Docker containers stopped and removed");
      } catch (cleanupErr) {
        await logsManager.addLog("     Warning: Some Docker cleanup steps may have failed", "error");
      }

      await logsManager.addLog("   Removing temporary files...");
      try {
        const extractedDir = path.join(WORK_DIR, 'extracted');
        const zipFile = path.join(WORK_DIR, `${id}.zip`);
        await exec(`rm -rf "${extractedDir}" "${zipFile}" "${testFilePath}"`);
        await logsManager.addLog("    Temporary files cleaned up");
      } catch (cleanupErr) {
        await logsManager.addLog("     Warning: Some file cleanup steps may have failed", "error");
      }

      const endTime = new Date().getTime();
      const totalTime = (endTime - startTime) / 1000;
      const minutes = Math.floor(totalTime / 60);
      const seconds = (totalTime % 60).toFixed(0);

      if (minutes > 0) {
        await logsManager.addLog(`  Total processing time: ${minutes}m ${seconds}s`);
      } else {
        await logsManager.addLog(`  Total processing time: ${totalTime.toFixed(1)}s`);
      }

      if (numberOfErrors > 0) {
        await logsManager.addLog(`ℹ️  Health check retries: ${numberOfErrors}`);
      }

      await logsManager.addLog(" Submission processing completed");

      // add entry in the database
      // respond to user 

    }
  }
}

main();
