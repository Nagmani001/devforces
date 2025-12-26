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

    // download user code 
    await downloadAndUnzipFile(url, id)
    const nameOfProject = "with-database-http-express";

    await exec(`cd src/${nameOfProject} && docker compose up -d`);

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

    // most probably the backend isn't starting correclty that is why the tests are failing
    const testFile = await prisma.challenge.findFirst({
      where: {
        id: "74a70518-d1df-47f6-8baa-472d9547464c"
      },
      select: {
        testFile: true,
      }
    });

    const response = await writeFile("/home/nagmani/root/projects/devforces/apps/worker/src/index.test.ts", testFile?.testFile!);
    const { stdout, stderr } = await exec(`pnpm test`);

    await exec(`cd src/${nameOfProject} && docker compose down`);


    await exec(`cd src/ && rm -rf ${nameOfProject} && rm -rf ${id}.zip && rm -rf index.test.ts`);

    const endTime = new Date().getTime();
    console.log(stdout);
    console.log("total time taken", (endTime - startTime) / 1000, "seconds");
    console.log("total number of errors it throwed = ", numberOfErrors);

    // add entry in the database

    pubSub.publish(id, JSON.stringify({
      msg: "hi"
    }));
  }
}

main();
