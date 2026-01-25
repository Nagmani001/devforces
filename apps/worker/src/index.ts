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

    await logsManager.addLog("Starting submission processing...");
    await logsManager.addLog(`Downloading submission from: ${url}`);

    const nameOfProject = await downloadAndUnzipFile(url, id);
    await logsManager.addLog(`Downloaded and extracted project: ${nameOfProject}`);

    await logsManager.addLog("Building Docker container...");
    await exec(`cd src/${nameOfProject} && docker compose build --no-cache  && docker compose up -d`);
    await logsManager.addLog("Docker container built and started");

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


    await writeFile("src/index.test.ts", testFile?.testFile!);
    await logsManager.addLog("Test file written, waiting for service to be ready...");

    while (true) {
      try {
        await axios.get("http://localhost:8000/health");
        await logsManager.addLog("Service is ready, starting tests...");
        break;
      } catch (err) {
        numberOfErrors++;
        continue;
      }
    }

    /*
    VJUDGE / CODEFORCES STYLE RANKING
    total_penalty = sigma(each_penalty(problem_i), for all SOLVED problem_i)
    each_penalty(p) = Number_of_Fail_Before_1st_AC * 20min + time_of_1st_AC_since_contest_start
    */

    try {
      await logsManager.addLog("Running test suite...");
      const { stdout, stderr } = await exec(`pnpm test`);
      const outputString = stdout.replace(/\\n/g, "\n").replace(/\\s/g, " ") || stderr.replace(/\\n/g, "\n").replace(/\\s/g, " ");
      const clean = outputString.replace(/\u001b\[[0-9;]*m/g, "");
      const match = clean.match(/Tests\s+(\d+)\s+passed/i);
      const numberOfPassedTestCases = Number(match[1]);

      const result = {
        passed: numberOfPassedTestCases,
        total: testFile?.totalTestCases!,
        failed: testFile?.totalTestCases! - numberOfPassedTestCases
      };

      await logsManager.addLog(`Tests completed: ${numberOfPassedTestCases}/${testFile?.totalTestCases} passed`);
      await logsManager.publishResult(result);

      console.log("number of passed test cases = ", numberOfPassedTestCases);
      console.log("total Test cases", testFile?.totalTestCases)
    } catch (err) {
      await logsManager.addLog("Test execution encountered errors", "error");
      //@ts-ignore
      const clean = err.stdout.replace(/\x1B\[[0-9;]*m/g, "");
      const match = clean.match(/(\d+)\s+failed/);
      const numberOfFailedTestCases = Number(match[1]);

      const result = {
        passed: testFile?.totalTestCases! - numberOfFailedTestCases,
        total: testFile?.totalTestCases!,
        failed: numberOfFailedTestCases
      };

      await logsManager.addLog(`Tests completed with failures: ${result.passed}/${testFile?.totalTestCases} passed`);
      await logsManager.publishResult(result);

      console.log("number of passed failedcases = ", numberOfFailedTestCases);
      console.log("total Test cases", testFile?.totalTestCases)
    } finally {
      await logsManager.addLog("Cleaning up Docker containers and temporary files...");
      await exec(`cd src/${nameOfProject} && docker compose down --rmi all`);
      await exec(`cd src/ && rm -rf extracted && rm -rf ${id}.zip && rm -rf index.test.ts`)
      const endTime = new Date().getTime();
      const totalTime = (endTime - startTime) / 1000;
      await logsManager.addLog(`Processing completed in ${totalTime.toFixed(2)} seconds`);
      console.log("total time taken", totalTime, "seconds");
      console.log("total number of errors it throwed = ", numberOfErrors);

      // add entry in the database
      // respond to user 

    }
  }
}

main();
