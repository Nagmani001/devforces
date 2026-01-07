import { Router, Request, Response } from "express";
import { redisClient } from "..";

export const leaderboardRouter: Router = Router();

leaderboardRouter.get("/live/:contestId", async (req: Request, res: Response) => {
  const contestId = req.params.contestId;
  const contestResult = await redisClient.zRangeWithScores(`contest_leaderboard_${contestId}`, 0, -1);
  res.json({
    contestResult
  });
});


leaderboardRouter.get("/stale/:contestId", (req: Request, res: Response) => {
  const contestId = req.params.contestId;



});
