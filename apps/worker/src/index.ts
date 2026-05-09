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

    // Test file MUST live inside the worker package dir so vitest:
    //   (a) finds its own install (node_modules/.bin/vitest, vitest config)
    //   (b) resolves test imports (axios etc.) from worker's node_modules
    //   (c) the file is under cwd so the default `**/*.test.ts` include matches.
    // WORK_DIR can be overridden to /tmp/... in prod for Docker bind-mounting,
    // which breaks all three. Keep WORK_DIR for downloads + docker compose, but
    // write the test file to a path tied to the worker package itself.
    const WORKER_PKG_DIR = path.resolve(__dirname, '..');
    const TEST_DIR = path.join(WORKER_PKG_DIR, 'work');
    await import('fs/promises').then(m => m.mkdir(TEST_DIR, { recursive: true }));
    const testFilePath = path.join(TEST_DIR, `${id}.test.ts`);
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

      // ---- DIAGNOSTIC LOGS (compare dev vs prod container) ----
      console.log('[DIAG] process.cwd', process.cwd());
      console.log('[DIAG] __dirname', __dirname);
      console.log('[DIAG] node version', process.version);
      console.log('[DIAG] platform', process.platform, process.arch);
      console.log('[DIAG] testFilePath', testFilePath);
      console.log('[DIAG] resultsJsonPath', resultsJsonPath);
      console.log('[DIAG] WORK_DIR', WORK_DIR);
      console.log('[DIAG] PATH', process.env.PATH);
      try {
        const stat = await import('fs/promises').then(m => m.stat(testFilePath));
        console.log('[DIAG] testFile size', stat.size);
      } catch (e: any) {
        console.log('[DIAG] testFile stat ERROR', e?.message);
      }
      try {
        const which = await exec('which npx && which vitest 2>/dev/null; npx --version; node --version');
        console.log('[DIAG] which', which.stdout, which.stderr);
      } catch (e: any) {
        console.log('[DIAG] which ERROR', e?.message);
      }
      try {
        const ls = await exec('ls -la node_modules/.bin/vitest 2>&1; ls -la /app/node_modules/.bin/vitest 2>&1');
        console.log('[DIAG] vitest bin', ls.stdout);
      } catch (e: any) {
        console.log('[DIAG] vitest bin ERROR', e?.message);
      }
      // --------------------------------------------------------

      // Use vitest JSON reporter — text-scraping the human summary is unreliable
      // (e.g. "1 failed" from "Test Files 1 failed" gets matched instead of the
      // real assertion count, and a missing summary made fallback math claim
      // every test passed). JSON file is written even on assertion failures.
      // Run vitest with two reporters: default (pretty UI streamed live to the
      // user) + json (written to file for reliable pass/fail counts).
      // Resolve vitest binary directly. `npx` falls back to a network install
      // when vitest isn't on PATH (which is the case in the prod container —
      // the Dockerfile doesn't add /app/node_modules/.bin or the worker's bin
      // dir to PATH). That fallback installs a different vitest version and
      // also runs vitest with cwd=/app, which can't find the test file.
      const fs = await import('fs/promises');
      const vitestCandidates = [
        path.join(WORKER_PKG_DIR, 'node_modules', '.bin', 'vitest'),
        path.resolve(WORKER_PKG_DIR, '..', '..', 'node_modules', '.bin', 'vitest'),
        '/app/node_modules/.bin/vitest',
      ];
      let vitestBin: string | null = null;
      for (const c of vitestCandidates) {
        try { await fs.access(c); vitestBin = c; break; } catch {}
      }
      console.log('[DIAG] resolved vitest bin', vitestBin);
      const vitestExitCode: number = await new Promise<number>((resolve) => {
        console.log('[DIAG] spawning vitest...');
        const child = vitestBin
          ? spawn(
              vitestBin,
              [
                'run',
                testFilePath,
                '--reporter=default',
                '--reporter=json',
                `--outputFile.json=${resultsJsonPath}`,
              ],
              { cwd: WORKER_PKG_DIR, env: { ...process.env, FORCE_COLOR: '0', CI: 'true' } }
            )
          : spawn(
              'npx',
              [
                'vitest',
                'run',
                testFilePath,
                '--reporter=default',
                '--reporter=json',
                `--outputFile.json=${resultsJsonPath}`,
              ],
              { cwd: WORKER_PKG_DIR, env: { ...process.env, FORCE_COLOR: '0', CI: 'true' } }
            );
        console.log('[DIAG] spawn pid', child.pid);

        let buffer = '';
        const collect = (buf: Buffer) => {
          const chunk = buf.toString('utf-8');
          process.stdout.write('[VITEST RAW] ' + chunk);
          buffer += chunk.replace(/\[[0-9;]*[A-Za-z]/g, '');
        };
        child.stdout.on('data', collect);
        child.stderr.on('data', collect);

        const emitSummary = async () => {
          // Match the vitest default-reporter summary block (leading whitespace + keyword).
          const summaryRe = /^\s*(Test Files|Tests|Start at|Duration|Snapshots)\s/;
          // Per-test status lines that appear above the summary.
          const testLineRe = /^\s*(✓|✗|×|PASS|FAIL)\s/;
          const lines = buffer.split('\n');
          for (const l of lines) {
            if (testLineRe.test(l)) await logsManager.addLog(l.trim());
          }
          for (const l of lines) {
            if (summaryRe.test(l)) await logsManager.addLog(l.trim());
          }
        };
        child.on('close', async (code: number | null) => {
          await emitSummary();
          resolve(code ?? 1);
        });
        child.on('error', async () => {
          await emitSummary();
          resolve(1);
        });
      });

      console.log('[DIAG] vitest exit code', vitestExitCode);
      try {
        const jstat = await import('fs/promises').then(m => m.stat(resultsJsonPath));
        console.log('[DIAG] json file size', jstat.size);
      } catch (e: any) {
        console.log('[DIAG] json file MISSING', e?.message);
      }
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
