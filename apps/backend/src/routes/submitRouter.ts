import { Router, Response, Request } from "express";
import { v4 as uuidv4 } from 'uuid';
import * as AWS from "@aws-sdk/client-s3";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { unauthorized } from "../lib/utils";
import { pubSub, redisClient } from "..";
import { REDIS_QUEUE_NAME } from "@repo/common/consts";
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
submitRouter.post("/submit/confirm/:challengeId", async (req: Request, res: Response) => {
  const userId = req.userId;

  const challengeId = req.params.challengeId;
  //TODO: check if challenge exists or not , challenge ka contest is started or not 

  if (!userId) return unauthorized(res);

  const uniqueId = uuidv4();
  const payload = {
    id: uniqueId,
    challengeId: challengeId,
    url: `https://nagmanidevforces.s3.ap-south-1.amazonaws.com/${userId}-challenge-${challengeId}`
  };

  pubSub.subscribe(uniqueId, (response) => {
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
