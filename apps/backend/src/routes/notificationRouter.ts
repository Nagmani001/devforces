import { Router } from "express";
import { notifyUser } from "@repo/email/email";
import prisma from "@repo/db/client";
import { unauthorized } from "../lib/utils";

export const notificationRotuer: Router = Router();

notificationRotuer.post("/notify/:contestId", async (req, res) => {
  const contestId = req.params.contestId;
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  const email = await prisma.user.findFirst({
    where: {
      id: userId
    },
    select: {
      email: true
    }
  });


  const contestStartTime = await prisma.contest.findFirst({
    where: {
      id: contestId
    },
    select: {
      startsAt: true,
    }
  });
  const ans = await notifyUser(email?.email!, contestStartTime?.startsAt!, `${process.env.DOMAIN_NAME}/contest/${contestId}`);
  res.json(ans)
});
