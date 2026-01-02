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

export async function persistInDb(workerResponse: PAYLOAD_TO_RECEIVE, challengeId: string, userId: string, contestId: string, contestResultId: string) {
  await prisma.$transaction([
    prisma.challengeResult.upsert({
      where: {
        challengeId: challengeId
      },
      create: {
        score: workerResponse.passed,
        penalty: workerResponse.passed == workerResponse.total ? (23) : (23),
        duration: 2323,
        numberOfFailBefore1stAC: workerResponse.passed == workerResponse.total ? 23 : 23,
        timeOf1stAcSinceContestStart: 23,
        contestResultId: "asldkfj",
        userId: userId,
        challengeId: challengeId!
      },
      update: {
        score: workerResponse.passed,
        penalty: workerResponse.passed == workerResponse.total ? (23) : (23),
        duration: 2323,
        numberOfFailBefore1stAC: workerResponse.passed == workerResponse.total ? 23 : 23,
        timeOf1stAcSinceContestStart: 23,
      }
    }),
  ])
}

/*
INFO: Codeforces style ranking
total_penalty = sigma(each_penalty(problem_i), for all SOLVED problem_i)
each_penalty(p) = Number_of_Fail_Before_1st_AC * 20min + time_of_1st_AC_since_contest_start
*/

export async function calculateScore(testResult: PAYLOAD_TO_RECEIVE, contestResultId: string, userId: string, challengeId: string) {
  if (testResult.passed == testResult.total) {
    // add 

  } else {
    await prisma.challengeResult.upsert({
      where: {
        id: challengeId
      },
      update: {
        numberOfFailBefore1stAC: {
          increment: 1
        }
      },
      create: {
        score: 23,
        penalty: 23,
        duration: 23,
        numberOfFailBefore1stAC: 23,
        timeOf1stAcSinceContestStart: 23,
        contestResultId: "23",
        challengeId: "23",
        userId
      }
    })
  }
}
