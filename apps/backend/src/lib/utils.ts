import { PAYLOAD_TO_RECEIVE } from "@repo/common/typescript-types";
import prisma from "@repo/db/client";
import axios2 from "axios";
import { Response } from "express";

export function unauthorized(res: Response) {
  return res.status(403).json({
    message: "invalid auth"
  })
}

export async function checkUserIsAdmin(userId: string, res: Response) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId
      }
    });
    return user?.isAdmin;

  } catch (err) {
    return res.status(500).json({
      message: "error occured during database fetching"
    });
  }
}

export const axios = {
  post: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.post(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  },

  get: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.get(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  },

  put: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.put(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  },

  delete: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.delete(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  }

};


export async function checkContestResultOrCreate(contestId: string, userId: string) {
  const findContestResult = await prisma.contestResult.findFirst({
    where: {
      userId,
      contestId
    }
  });
  if (findContestResult) {
    return {
      contestResultId: findContestResult.id
    }
  } else {
    const createContestResult = await prisma.contestResult.create({
      data: {
        status: "RUNNING",
        contestId,
        userId
      }
    });
    return {
      contestResultId: createContestResult.id
    }
  }
}

/*
INFO: Codeforces style ranking
total_penalty = sigma(each_penalty(problem_i), for all SOLVED problem_i)
each_penalty(p) = Number_of_Fail_Before_1st_AC * 20min + time_of_1st_AC_since_contest_start
*/

export async function calculateScoreAndUpdateDb(testResult: PAYLOAD_TO_RECEIVE, contestResultId: string, userId: string, challengeId: string, startsAt: Date) {
  const challengeResult = await prisma.challengeResult.findFirst({
    where: {
      userId,
      challengeId
    }
  });

  const currentTime = new Date();
  const timeTakenInSecond = Math.floor((currentTime.getTime() - startsAt.getTime()) / 1000);
  const numberOfFailBefore1stAC = challengeResult?.numberOfFailBefore1stAC || 0;
  const timeTakenInMinute = Math.floor(timeTakenInSecond / 60);

  if (testResult.passed == testResult.total) {

    await prisma.challengeResult.upsert({
      where: {
        userId,
        challengeId
      },
      update: {
        score: testResult.passed,
        penalty: (numberOfFailBefore1stAC * 20) + timeTakenInMinute,
        duration: timeTakenInSecond,
        timeOf1stAcSinceContestStart: timeTakenInSecond,
        contestResultId,
        challengeId,
        userId
      },
      create: {
        score: testResult.passed,
        penalty: timeTakenInMinute,
        duration: timeTakenInSecond,
        numberOfFailBefore1stAC: 0,
        timeOf1stAcSinceContestStart: timeTakenInSecond,
        contestResultId,
        challengeId,
        userId
      }
    })


  } else {
    await prisma.challengeResult.upsert({
      where: {
        userId,
        challengeId
      },
      update: {
        score: testResult.passed,
        penalty: ((numberOfFailBefore1stAC + 1) * 20),
        duration: timeTakenInSecond,
        numberOfFailBefore1stAC: {
          increment: 1
        },
        contestResultId,
        challengeId,
        userId
      },
      create: {
        score: testResult.passed,
        penalty: timeTakenInMinute,
        duration: timeTakenInSecond,
        numberOfFailBefore1stAC: 1,
        contestResultId,
        challengeId,
        userId
      }
    })
  }
}
