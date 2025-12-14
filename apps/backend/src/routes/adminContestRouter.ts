import { Router, Response, Request } from "express";
import { checkUserIsAdmin, unauthorized } from "../lib/utils";
import prisma from "@repo/db/client";
import { createContestSchema, updateContestSchema } from "../zodTypes";

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
        userId
      },
      take: 10,
      orderBy: {
        createdAt: "asc"
      }
    })
      :
      await prisma.contest.findMany({
        where: {
          userId
        },
        take: 10,
        skip: (page * 10) - 10,
        orderBy: {
          createdAt: "asc"
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
  const { title, duration, startsAt, challenges } = parsedData.data;

  try {
    const createSchema = await prisma.contest.create({
      data: {
        title,
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

adminContestRouter.delete("/create/:id", async (req: Request, res: Response) => {
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

    //WARNING: might want to put it somewhere else ....
    await prisma.contest.delete({
      where: { id: contestId }, include: {
        challenges: true,
        contestResult: true
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
    const updateContest = await prisma.contest.update({
      where: {
        id: contestId
      },
      data: {
        title,
        duration,
        startsAt,
        challenges: {
          create: challenges
        }
      }
    });

    res.json({
      message: "updated contest successfully"
    });
  } catch (err) {
    return res.status(500).json({
      message: "error while putting to the database"
    });
  }
});
