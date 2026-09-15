import { Router, Response, Request } from "express";
import { v4 as uuidv4 } from 'uuid';
import { createUploadUrl, getDownloadUrl } from "@repo/storage/storage";
import { calculateScoreAndUpdateDb, checkContestResultOrCreate, unauthorized } from "../lib/utils";
import { pubSub, redisClient } from "..";
import { REDIS_QUEUE_NAME } from "@repo/common/consts";
import { PAYLOAD_TO_PUSH, PAYLOAD_TO_RECEIVE } from "@repo/common/typescript-types";
import prisma from "@repo/db/client";
export const submitRouter: Router = Router();

// Each submission must live at its own object key, otherwise every new submission
// overwrites the previous one and past code becomes unrecoverable. The submission
// token is unique per submission, so fold it into the key.
function submissionStorageKey(userId: string, challengeId: string, token: string) {
  return `${userId}-challenge-${challengeId}-${token}`;
}

submitRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  try {
    const sessions = await prisma.submissionSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        challengeId: true,
        contestId: true,
        status: true,
        createdAt: true,
      },
    });

    const challengeIds = [...new Set(sessions.map((s) => s.challengeId))];
    const contestIds = [...new Set(sessions.map((s) => s.contestId))];

    const [challenges, contests] = await Promise.all([
      prisma.challenge.findMany({
        where: { id: { in: challengeIds } },
        select: { id: true, title: true },
      }),
      prisma.contest.findMany({
        where: { id: { in: contestIds } },
        select: { id: true, title: true },
      }),
    ]);

    const challengeTitle = new Map(challenges.map((c) => [c.id, c.title]));
    const contestTitle = new Map(contests.map((c) => [c.id, c.title]));

    res.json({
      submissions: sessions.map((s) => ({
        id: s.id,
        challenge: challengeTitle.get(s.challengeId) ?? "Unknown challenge",
        contest: contestTitle.get(s.contestId) ?? "Unknown contest",
        status: s.status,
        submittedAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("error listing submissions", err);
    return res.status(500).json({ message: "error while fetching submissions" });
  }
});

// All submissions by the current user for a specific challenge, newest first.
// `slug` is the short public identifier used in the arena URL.
submitRouter.get("/challenge/:challengeId", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  const challengeId = req.params.challengeId;
  const contestId = req.query.contestId as string | undefined;

  try {
    const sessions = await prisma.submissionSession.findMany({
      where: {
        userId,
        challengeId,
        ...(contestId ? { contestId } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        status: true,
        testCasesPassed: true,
        testCasesTotal: true,
        createdAt: true,
      },
    });

    res.json({
      submissions: sessions.map((s) => ({
        id: s.id,
        slug: s.token,
        status: s.status,
        testCasesPassed: s.testCasesPassed,
        testCasesTotal: s.testCasesTotal,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("error listing challenge submissions", err);
    return res.status(500).json({ message: "error while fetching submissions" });
  }
});

// Returns a direct URL to the submitted archive so the client can download the
// code straight from object storage. Ownership is enforced by looking the
// session up for the current user before touching storage.
submitRouter.get("/:submissionId/downloadUrl", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  const submissionId = req.params.submissionId;

  try {
    const session = await prisma.submissionSession.findFirst({
      where: { id: submissionId, userId },
      select: { userId: true, challengeId: true, token: true },
    });

    if (!session) {
      return res.status(404).json({ message: "submission not found" });
    }

    res.json({
      url: getDownloadUrl(
        submissionStorageKey(session.userId, session.challengeId, session.token)
      ),
    });
  } catch (err) {
    console.error("error getting submission download url", err);
    return res.status(500).json({ message: "error while getting submission download url" });
  }
});

submitRouter.get("/preSignedUrl/:challengeId", async (req: Request, res: Response) => {
  const userId = req.userId;
  const challengeId = req.params.challengeId;
  //TODO: check if challenge exists or not , challenge ka contest is started or not 

  if (!userId) return unauthorized(res);

  // Generate submission token
  const submissionToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Token expires in 10 minutes

  // Create submission session (we'll need contestId later, but for now we can make it optional or get from query)
  const contestId = req.query.contestId as string | undefined;

  if (contestId) {
    await prisma.submissionSession.create({
      data: {
        token: submissionToken,
        userId,
        contestId,
        challengeId: challengeId!,
        status: "pending",
        expiresAt
      }
    });
  }

  const { url, method, fields, headers } = await createUploadUrl({
    key: submissionStorageKey(userId, challengeId!, submissionToken),
    maxSizeBytes: 50 * 1024 * 1024,
    expiresInSeconds: 3600
  })

  res.json({
    preSignedUrl: url,
    method,
    fields: fields ?? {},
    headers: headers ?? {},
    submissionToken
  })
});

//WARNING: what if user uploads but the request to confirm fails ? this approach is not atomic  
submitRouter.post("/submit/confirm/:contestId/:challengeId", async (req: Request, res: Response) => {
  const userId = req.userId;
  const contestId = req.params.contestId;
  const challengeId = req.params.challengeId;
  const { submissionToken } = req.body;
  //TODO: check if challenge exists or not , challenge ka contest is started or not 

  if (!userId) return unauthorized(res);
  if (!submissionToken) {
    return res.status(400).json({ message: "submissionToken is required" });
  }

  // Validate submission session
  const session = await prisma.submissionSession.findFirst({
    where: {
      token: submissionToken,
      userId,
      contestId,
      challengeId,
      status: "pending",
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!session) {
    return res.status(404).json({ message: "Invalid or expired submission token" });
  }

  // Update session status to processing
  await prisma.submissionSession.update({
    where: { id: session.id },
    data: { status: "processing" }
  });

  // Use submissionToken as the unique ID for this submission
  const uniqueId = submissionToken;

  const payload: PAYLOAD_TO_PUSH = {
    id: uniqueId,
    challengeId: challengeId!,
    url: getDownloadUrl(submissionStorageKey(userId, challengeId!, uniqueId))
  };

  const { contestResultId } = await checkContestResultOrCreate(contestId!, userId);

  const getContestData = await prisma.contest.findFirst({
    where: {
      id: contestId
    }
  });

  // Subscribe to results asynchronously (non-blocking) to process final results
  // This runs in the background and updates the database when results arrive
  pubSub.subscribe(uniqueId, async (response) => {
    try {
      const parsed = JSON.parse(response);

      // Check if this is a result message
      if (parsed.type === "result") {
        const parsedResponse: PAYLOAD_TO_RECEIVE = JSON.parse(parsed.data.message);

        await calculateScoreAndUpdateDb(parsedResponse, contestResultId, userId, challengeId!, getContestData?.startsAt!);
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

        await redisClient.zAdd(`contest_leaderboard_${contestId}`, {
          score: scoreSum._sum.score! - (scoreSum._sum.penalty!) / 1000,
          value: userId
        });

        await redisClient.hSet(`contest_leaderboard_${contestId}_userId_${userId}`, {
          penalty: scoreSum._sum.penalty!,
        });

        // Mark session as completed
        await prisma.submissionSession.update({
          where: { id: session.id },
          data: {
            status: "completed",
            testCasesPassed: parsedResponse.passed,
            testCasesTotal: parsedResponse.total,
          }
        });

        // Unsubscribe after processing result
        await pubSub.unsubscribe(uniqueId);
      }
    } catch (err) {
      console.error("Error processing result:", err);
    }
  }).catch(err => {
    console.error("Error subscribing to result channel:", err);
  });

  await redisClient.lPush(REDIS_QUEUE_NAME, JSON.stringify(payload));

  res.json({
    message: "Submission queued",
    submissionToken: uniqueId
  });
});



/*
Thought of this route so that user can just run their code on which there is no score 
or with very less penalty 

submitRouter.post("/run", (req: Request, res: Response) => {

});
  */
