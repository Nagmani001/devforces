import prisma from "@repo/db/client";
import { Router, Response, Request } from "express";

export const userContestRouter: Router = Router();

userContestRouter.get("/", async (req: Request, res: Response) => {
  const page = Number(req.query.page);
  try {
    const contests = page == 1 ? await prisma.contest.findMany({
      where: {
        isDeleted: false
      },
      take: 10,
      include: {
        _count: {
          select: {
            challenges: true
          }
        }
      }
    }) :
      await prisma.contest.findMany({
        where: {
          isDeleted: false
        },
        take: 10,
        skip: (page * 10) - 10,
        include: {
          _count: {
            select: {
              challenges: true
            }
          }
        }
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
      },
      select: {
        contestId: true,
        dockerComposeFile: false,
        id: true,
        notionLink: false,
        startupScript: false,
        testFile: false,
        title: true,
        totalTestCases: true,
        challengeResult: true
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

userContestRouter.get("/challenge/:challengeId", async (req: Request, res: Response) => {
  const challengeId = req.params.challengeId;
  try {
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
      },
      select: {
        title: true,
        notionLink: true,
        testFile: false,
        dockerComposeFile: false,
        startupScript: false,
        totalTestCases: true,
      }
    });
    res.json({
      challenge
    })
  } catch (err) {
    res.status(500).json({
      message: "something went wrong"
    })

  }
});

userContestRouter.post("/started/:contestId/:challengeId", (req: Request, res: Response) => {
  const contestId = req.params.contestId;

});

//WARNING:repeated in adminRouter as well 
userContestRouter.get("/totalPages", async (req: Request, res: Response) => {
  const totalContestRows = await prisma.contest.count();
  const totalPage = totalContestRows / 10;

  res.json({
    total: totalPage < 1 ? 1
      : totalPage % 1 == 0 ? totalPage
        : Math.floor(totalPage + 1)
  });
});
