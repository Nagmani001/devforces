import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { config } from "dotenv";
import { writeFile } from 'fs/promises';
import { createClient, RedisClientType } from "redis";
import util from "util";
const exec = util.promisify(require('child_process').exec);
import prisma from "@repo/db/client";
import { downloadAndUnzipFile } from "./lib/utils";
import { LogsManager } from "./lib/logsManager";
import axios from "axios";
config();

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

    const nameOfProject = await downloadAndUnzipFile(url, id, logsManager);
    await logsManager.addLog(` Project extracted successfully: ${nameOfProject}`);

    await logsManager.addLog(" Building Docker container (this may take a few minutes)...");

    // Build Docker container
    await logsManager.addLog(" Step 1/2: Building Docker image...");
    const buildResult = await exec(`cd src/${nameOfProject} && docker compose build --no-cache`);

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

    const upResult = await exec(`cd src/${nameOfProject} && docker compose up -d`);
    const upOutput = upResult.stdout || upResult.stderr || '';

    // Log full container startup output
    const upLines = upOutput.split('\n').filter((line: string) => line.trim());
    for (const line of upLines) {
      if (line.trim()) {
        await logsManager.addLog(`   ${line.trim()}`);
      }
    }

    await logsManager.addLog(" Docker containers started successfully");

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

    await logsManager.addLog(` Preparing test suite (${testFile.totalTestCases} test cases expected)`);
    await writeFile("src/index.test.ts", testFile.testFile);
    await logsManager.addLog(" Test file written successfully");
    await logsManager.addLog(" Waiting for service to be ready (health check)...");

    let healthCheckAttempts = 0;
    const maxHealthCheckAttempts = 30; // 30 attempts max

    while (true) {
      try {
        const healthResponse = await axios.get("http://localhost:8000/health", { timeout: 2000 });
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

    try {
      await logsManager.addLog(` Executing ${testFile.totalTestCases} test cases...`);
      const { stdout, stderr } = await exec(`pnpm test`);

      const outputString = stdout.replace(/\\n/g, "\n").replace(/\\s/g, " ") || stderr.replace(/\\n/g, "\n").replace(/\\s/g, " ");
      const clean = outputString.replace(/\u001b\[[0-9;]*m/g, "");

      const testLines = clean.split('\n').filter((line: string) => line.trim());

      const passedMatch = clean.match(/Tests\s+(\d+)\s+passed/i);
      const failedMatch = clean.match(/(\d+)\s+failed/i);
      const testMatch = clean.match(/(\d+)\s+test/i);

      if (testMatch) {
        await logsManager.addLog(`   Running ${testMatch[1]} test(s)...`);
      }

      const importantLines = testLines.filter((line: string) =>
        line.includes('PASS') ||
        line.includes('FAIL') ||
        line.includes('✓') ||
        line.includes('✗') ||
        (line.includes('test') && (line.includes('passed') || line.includes('failed')))
      ).slice(0, 5);

      for (const line of importantLines) {
        if (line.trim() && line.length < 200) {
          await logsManager.addLog(`   ${line.trim()}`);
        }
      }

      const numberOfPassedTestCases = passedMatch ? Number(passedMatch[1]) : 0;
      const numberOfFailedTestCases = failedMatch ? Number(failedMatch[1]) : (testFile.totalTestCases - numberOfPassedTestCases);

      const result = {
        passed: numberOfPassedTestCases,
        total: testFile.totalTestCases,
        failed: numberOfFailedTestCases
      };

      if (numberOfPassedTestCases === testFile.totalTestCases) {
        await logsManager.addLog(` All tests passed! (${numberOfPassedTestCases}/${testFile.totalTestCases})`);
      } else {
        await logsManager.addLog(`  Tests completed: ${numberOfPassedTestCases} passed, ${numberOfFailedTestCases} failed (${testFile.totalTestCases} total)`);
      }

      await logsManager.publishResult(result);

      console.log("number of passed test cases = ", numberOfPassedTestCases);
      console.log("total Test cases", testFile.totalTestCases)
    } catch (err: any) {
      await logsManager.addLog(" Test execution encountered errors", "error");

      //@ts-ignore
      const errorOutput = err.stdout || err.stderr || err.message || '';
      const clean = errorOutput.toString().replace(/\x1B\[[0-9;]*m/g, "");

      const failedMatch = clean.match(/(\d+)\s+failed/i);
      const passedMatch = clean.match(/(\d+)\s+passed/i);

      const numberOfFailedTestCases = failedMatch ? Number(failedMatch[1]) : 0;
      const numberOfPassedTestCases = passedMatch ? Number(passedMatch[1]) : (testFile.totalTestCases - numberOfFailedTestCases);

      const errorLines = clean.split('\n')
        .filter((line: string) =>
          line.includes('FAIL') ||
          line.includes('Error') ||
          line.includes('failed') ||
          (line.includes('test') && line.includes('failed'))
        )
        .slice(0, 3);

      for (const line of errorLines) {
        if (line.trim() && line.length < 200) {
          await logsManager.addLog(`   ${line.trim()}`, "error");
        }
      }

      const result = {
        passed: numberOfPassedTestCases,
        total: testFile.totalTestCases,
        failed: numberOfFailedTestCases
      };

      await logsManager.addLog(`  Test results: ${result.passed} passed, ${result.failed} failed (${testFile.totalTestCases} total)`, "error");
      await logsManager.publishResult(result);

      console.log("number of passed failedcases = ", numberOfFailedTestCases);
      console.log("total Test cases", testFile.totalTestCases)
    } finally {
      await logsManager.addLog(" Cleaning up resources...");
      await logsManager.addLog("   Stopping Docker containers...");

      try {
        await exec(`cd src/${nameOfProject} && docker compose down --rmi all`);
        await logsManager.addLog("   Docker containers stopped and removed");
      } catch (cleanupErr) {
        await logsManager.addLog("     Warning: Some Docker cleanup steps may have failed", "error");
      }

      await logsManager.addLog("   Removing temporary files...");
      try {
        await exec(`cd src/ && rm -rf extracted && rm -rf ${id}.zip && rm -rf index.test.ts`);
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

      console.log("total time taken", totalTime, "seconds");
      console.log("total number of errors it throwed = ", numberOfErrors);

      // add entry in the database
      // respond to user 

    }
  }
}

main();
