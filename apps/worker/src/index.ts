import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { writeFile } from 'fs/promises';
import { createClient } from "redis";
import util from "util";
const exec = util.promisify(require('child_process').exec);
import prisma from "@repo/db/client";
import { downloadAndUnzipFile } from "./lib/utils";
import axios from "axios";

const redisClient = createClient();
const pubSub = createClient();


async function main() {
  await redisClient.connect();
  console.log("Connected to redis");
  await pubSub.connect();
  console.log("Connected to pubSub");

  while (true) {
    const popped = await redisClient.brPop(REDIS_QUEUE_NAME, 0);
    const startTime = new Date().getTime();
    const { id, challengeId, url } = JSON.parse(popped?.element!);

    const nameOfProject = await downloadAndUnzipFile(url, id);

    await exec(`cd src/${nameOfProject} && docker compose build --no-cache  && docker compose up -d`);

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

    while (true) {
      try {
        await axios.get("http://localhost:8000/todos");
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
      const { stdout, stderr } = await exec(`pnpm test`);
      const outputString = stdout.replace(/\\n/g, "\n").replace(/\\s/g, " ") || stderr.replace(/\\n/g, "\n").replace(/\\s/g, " ");
      const clean = outputString.replace(/\u001b\[[0-9;]*m/g, "");
      const match = clean.match(/Tests\s+(\d+)\s+passed/i);
      const numberOfPassedTestCases = Number(match[1]);

      pubSub.publish(id, JSON.stringify({
        passed: numberOfPassedTestCases,
        total: testFile?.totalTestCases,
        failed: testFile?.totalTestCases! - numberOfPassedTestCases
      }));

      console.log("number of passed test cases = ", numberOfPassedTestCases);
      console.log("total Test cases", testFile?.totalTestCases)
    } catch (err) {
      //@ts-ignore
      const clean = err.stdout.replace(/\x1B\[[0-9;]*m/g, "");
      const match = clean.match(/(\d+)\s+failed/);
      const numberOfFailedTestCases = Number(match[1]);

      pubSub.publish(id, JSON.stringify({
        passed: testFile?.totalTestCases! - numberOfFailedTestCases,
        total: testFile?.totalTestCases,
        failed: numberOfFailedTestCases
      }));

      console.log("number of passed failedcases = ", numberOfFailedTestCases);
      console.log("total Test cases", testFile?.totalTestCases)
    } finally {
      await exec(`cd src/${nameOfProject} && docker compose down --rmi all`);
      await exec(`cd src/ && rm -rf extracted && rm -rf ${id}.zip && rm -rf index.test.ts`)
      const endTime = new Date().getTime();
      console.log("total time taken", (endTime - startTime) / 1000, "seconds");
      console.log("total number of errors it throwed = ", numberOfErrors);

      // add entry in the database
      // respond to user 

    }
  }
}

main();
