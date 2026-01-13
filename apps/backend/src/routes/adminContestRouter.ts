import { Router, Response, Request } from "express";
import { checkUserIsAdmin, unauthorized } from "../lib/utils";
import prisma from "@repo/db/client";
import { createContestSchema, updateContestSchema } from "@repo/common/zodTypes";

export const adminContestRouter: Router = Router();

adminContestRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.userId;
  const page = Number(req.query.page);
  if (!userId) return unauthorized(res);

  const isAdmin = await checkUserIsAdmin(userId, res);
  if (!isAdmin) {
    return res.status(400).json({
      message: "you are not admin"
    });
  }

  try {
    const contests = page == 1 ? await prisma.contest.findMany({
      where: {
        userId,
        isDeleted: false
      },
      take: 10,
      orderBy: {
        createdAt: "asc"
      },
      include: {
        _count: {
          select: {
            challenges: true
          }
        }
      }
    })
      :
      await prisma.contest.findMany({
        where: {
          userId,
          isDeleted: false
        },
        take: 10,
        skip: (page * 10) - 10,
        orderBy: {
          createdAt: "asc"
        },
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
      message: "error occured while fetching contests"
    })
  }
});


adminContestRouter.post("/create", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  const isAdmin = await checkUserIsAdmin(userId, res);

  if (!isAdmin) {
    return res.status(400).json({
      message: "you are not admin"
    });
  }

  const parsedData = createContestSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "invalid inputs"
    })
  }
  const { title, subtitle, duration, startsAt, challenges } = parsedData.data;

  try {
    const createSchema = await prisma.contest.create({
      data: {
        title,
        subtitle,
        duration,
        startsAt,
        userId,
        challenges: {
          create: challenges
        }
      }
    });
    res.json({
      message: "Contest created successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: "error creating contest"
    });
  }
});

adminContestRouter.delete("/delete/:id", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);
  const contestId = req.params.id;

  const isAdmin = await checkUserIsAdmin(userId, res);

  if (!isAdmin) {
    return res.status(400).json({
      message: "you are not admin"
    });
  }

  try {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId
      }
    });

    if (contest?.userId != userId) {
      return res.status(400).json({
        message: "you did not create this contest"
      });
    }

    await prisma.contest.update({
      where: {
        id: contestId
      },
      data: {
        isDeleted: true
      }
    });

    res.json({
      message: "contest deleted successfully"
    });
  } catch (err) {
    return res.status(500).json({
      message: "error while fetching from database"
    });
  }
});


adminContestRouter.get("/update/:id", async (req: Request, res: Response) => {

  const userId = req.userId;
  if (!userId) return unauthorized(res);
  const contestId = req.params.id;

  const isAdmin = await checkUserIsAdmin(userId, res);

  if (!isAdmin) {
    return res.status(400).json({
      message: "you are not admin"
    });
  }
  //WARNING: there is no check for you did not create this contest

  try {
    const contestWithChallenges = await prisma.contest.findFirst({
      where: {
        id: contestId,
      },
      include: {
        challenges: true
      }
    });
    res.json({
      contests: contestWithChallenges
    })
  } catch (err) {
    res.status(500).json({
      message: "something went wrong"
    })
  }
});

adminContestRouter.put("/update/:id", async (req: Request, res: Response) => {

  const userId = req.userId;
  if (!userId) return unauthorized(res);
  const contestId = req.params.id;
  if (!contestId) {
    return res.status(400).json({
      message: "no contest id provided"
    });
  }

  const isAdmin = await checkUserIsAdmin(userId, res);

  if (!isAdmin) {
    return res.status(400).json({
      message: "you are not admin"
    });
  }

  try {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId
      }
    });

    if (contest?.userId != userId) {
      return res.status(400).json({
        message: "you did not create this contest"
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "error while fetching from database"
    });
  }
  const parsedData = updateContestSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({
      message: "invalid inputs"
    });
  }

  const { title, duration, startsAt, challenges } = parsedData.data;
  try {
    await prisma.contest.update({
      where: {
        id: contestId
      },
      data: {
        title,
        duration,
        startsAt,
      }
    });

    for (const challenge of challenges!) {
      await prisma.challenge.upsert({
        where: {
          id: challenge.id ?? ""
        }
      })
    }

    res.json({
      message: "updated contest successfully"
    });
  } catch (err) {
    return res.status(500).json({
      message: "error while putting to the database"
    });
  }
});

adminContestRouter.get("/totalPages", async (req: Request, res: Response) => {
  const totalContestRows = await prisma.contest.count();
  const totalPage = totalContestRows / 10;

  res.json({
    total: totalPage < 1 ? 1
      : totalPage % 1 == 0 ? totalPage
        : Math.floor(totalPage + 1)
  });
});
