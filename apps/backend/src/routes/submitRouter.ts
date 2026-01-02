import { Router, Response, Request } from "express";
import { v4 as uuidv4 } from 'uuid';
import * as AWS from "@aws-sdk/client-s3";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { checkContestResultOrCreate, unauthorized } from "../lib/utils";
import { pubSub, redisClient, soortedSetClient } from "..";
import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { PAYLOAD_TO_PUSH, PAYLOAD_TO_RECEIVE } from "@repo/common/typescript-types";
import prisma from "@repo/db/client";
export const submitRouter: Router = Router();

// envs automatically infered
const s3Client = new AWS.S3({
  region: "ap-south-1"
});

submitRouter.get("/preSignedUrl/:challengeId", async (req: Request, res: Response) => {
  const userId = req.userId;
  const challengeId = req.params.challengeId;
  //TODO: check if challenge exists or not , challenge ka contest is started or not 

  if (!userId) return unauthorized(res);

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: "nagmanidevforces",
    Key: `${userId}-challenge-${challengeId}`,
    Conditions: [
      ['content-length-range', 0, 50 * 1024 * 1024]
    ],
    Expires: 3600
  })

  res.json({
    preSignedUrl: url,
    fields
  })
});

//WARNING: what if user uploads but the request to confirm fails ? this approach is not atomic  
submitRouter.post("/submit/confirm/:contestId/:challengeId", async (req: Request, res: Response) => {
  const userId = req.userId;
  const contestId = req.params.contestId;
  const challengeId = req.params.challengeId;
  //TODO: check if challenge exists or not , challenge ka contest is started or not 

  if (!userId) return unauthorized(res);

  const uniqueId = uuidv4();


  const payload: PAYLOAD_TO_PUSH = {
    id: uniqueId,
    challengeId: challengeId!,
    url: `https://nagmanidevforces.s3.ap-south-1.amazonaws.com/${userId}-challenge-${challengeId}`
  };

  const { contestResultId } = await checkContestResultOrCreate(contestId!, userId);


  pubSub.subscribe(uniqueId, async (response) => {
    const parsedResponse: PAYLOAD_TO_RECEIVE = JSON.parse(response);

    const scoreSum = await prisma.challengeResult.aggregate({
      _sum: {
        score: true,
        penalty: true
      },
      where: {
        userId,
        contestResultId: contestResultId
      },
    });

    soortedSetClient.zAdd(`contest_leaderboard_${contestId}`, {
      score: scoreSum._sum.score! - (scoreSum._sum.penalty!) / 1000,
      value: userId
    });

    res.json(response);
  });

  await redisClient.lPush(REDIS_QUEUE_NAME, JSON.stringify(payload));
});



/*
Thought of this route so that user can just run their code on which there is no score 
or with very less penalty 

submitRouter.post("/run", (req: Request, res: Response) => {

});
  */
