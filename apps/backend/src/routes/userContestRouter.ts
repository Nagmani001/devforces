import prisma from "@repo/db/client";
import { Router, Response, Request } from "express";

export const userContestRouter: Router = Router();

userContestRouter.get("/", async (req: Request, res: Response) => {
  const page = Number(req.query.page);
  try {
    const contests = page == 1 ? await prisma.contest.findMany({
      take: 10,
    }) :
      await prisma.contest.findMany({
        take: 10,
        skip: (page * 10) - 10
      });

    res.json({
      contests
    });
  } catch (err) {
    return res.status(500).json({
      message: "error while fetching from database",
    });
  }
});


userContestRouter.get("/:contestId/challenges", async (req: Request, res: Response) => {
  const contestId = req.params.contestId;

  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        contestId
      }
    });

    res.json({
      challenges
    });
  } catch (err) {
    return res.status(500).json({
      message: "error while fetching from database",
    });
  }
});
