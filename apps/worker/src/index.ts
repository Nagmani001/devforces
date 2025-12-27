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

    while (true) {
      try {
        await axios.get("http://localhost:8000/todos");
        break;
      } catch (err) {
        numberOfErrors++;
        continue;
      }
    }

    const testFile = await prisma.challenge.findFirst({
      where: {
        id: "74a70518-d1df-47f6-8baa-472d9547464c"
      },
      select: {
        testFile: true,
      }
    });

    await writeFile("src/index.test.ts", testFile?.testFile!);
    const { stdout, stderr } = await exec(`pnpm test`);

    console.log("stdout", stdout);
    console.log("hi");
    console.log("stderr", stderr);

    await exec(`cd src/${nameOfProject} && docker compose down --rmi all`);

    await exec(`cd src/ && rm -rf extracted && rm -rf ${id}.zip && rm -rf index.test.ts`)

    const endTime = new Date().getTime();


    /*
    const clean = stdout.replace(/\x1B\[[0-9;]*m/g, "");
    const testsPassedMatch = clean.match(/Tests\s+(\d+)\s+passed/);
    const testsFailedMatch = clean.match(/Tests\s+(\d+)\s+failed/);

    const passed = testsPassedMatch ? Number(testsPassedMatch[1]) : 0;
    const failed = testsFailedMatch ? Number(testsFailedMatch[1]) : 0;

    console.log({ passed, failed });
     * */


    console.log("total time taken", (endTime - startTime) / 1000, "seconds");
    console.log("total number of errors it throwed = ", numberOfErrors);

    // add entry in the database

    pubSub.publish(id, JSON.stringify({
      msg: "hi"
    }));
  }
}

main();
