import { Router, Request, Response } from "express";
import { pubSub, redisClient } from "..";
import prisma from "@repo/db/client";
import { leaderboardChannel, leaderboardKey } from "@repo/common/consts";

export const leaderboardRouter: Router = Router();
type ProblemSubmission = {
  time: string;
  attempts: number;
  status: "solved" | "attempted" | "not_attempted";
};

type LeaderboardPayload = {
  mode: "live" | "static";
  updatedAt: string;
  problems: { id: string; title: string; solved: number; total: number }[];
  rows: {
    rank: number;
    userId: string;
    username: string;
    avatar?: string;
    score: number;
    penalty: number;
    problems: Record<string, ProblemSubmission>;
  }[];
};

function contestEndTime(contest: { startsAt: Date; duration: number }) {
  return contest.startsAt.getTime() + contest.duration * 1000;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function problemLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function rankRows<T extends { score: number; penalty: number }>(rows: T[]) {
  return rows
    .sort((a, b) => b.score - a.score || a.penalty - b.penalty)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

async function buildLeaderboardPayload(contestId: string, mode: "live" | "static"): Promise<LeaderboardPayload | null> {
  const contest = await prisma.contest.findFirst({
    where: { id: contestId, isDeleted: false },
    include: {
      challenges: {
        orderBy: { title: "asc" },
        select: { id: true, title: true, totalTestCases: true },
      },
      contestResult: {
        include: {
          user: { select: { id: true, username: true, name: true, imageUrl: true } },
          challengeResult: true,
        },
      },
    },
  });

  if (!contest) return null;

  const problemIds = new Map(contest.challenges.map((challenge, index) => [challenge.id, problemLabel(index)]));
  const solvedByProblem = new Map<string, number>();

  const baseRows = contest.contestResult.map((contestResult) => {
    const problems: Record<string, ProblemSubmission> = {};

    for (const challenge of contest.challenges) {
      const label = problemIds.get(challenge.id)!;
      const result = contestResult.challengeResult.find((item) => item.challengeId === challenge.id);

      if (!result) {
        problems[label] = { time: "", attempts: 0, status: "not_attempted" };
        continue;
      }

      const solved = result.score === challenge.totalTestCases;
      if (solved) solvedByProblem.set(label, (solvedByProblem.get(label) ?? 0) + 1);

      problems[label] = {
        time: solved ? formatDuration(result.timeOf1stAcSinceContestStart) : "",
        attempts: result.numberOfFailBefore1stAC ? -result.numberOfFailBefore1stAC : 0,
        status: solved ? "solved" : "attempted",
      };
    }

    return {
      userId: contestResult.userId,
      username: contestResult.user.username || contestResult.user.name || "Anonymous",
      avatar: contestResult.user.imageUrl ?? undefined,
      score: contestResult.challengeResult.reduce((sum, result) => sum + result.score, 0),
      penalty: contestResult.challengeResult.reduce((sum, result) => sum + result.penalty, 0),
      problems,
    };
  });

  const rows = rankRows(baseRows);

  if (mode === "live") {
    const liveUserIds = await redisClient.zRange(leaderboardKey(contestId), 0, -1, { REV: true });
    const liveRank = new Map(liveUserIds.map((userId, index) => [userId, index + 1]));

    rows.sort((a, b) => {
      const rankA = liveRank.get(a.userId);
      const rankB = liveRank.get(b.userId);
      if (rankA && rankB) return rankA - rankB;
      if (rankA) return -1;
      if (rankB) return 1;
      return a.rank - b.rank;
    });

    rows.forEach((row, index) => {
      row.rank = index + 1;
    });
  }

  return {
    mode,
    updatedAt: new Date().toISOString(),
    problems: contest.challenges.map((challenge, index) => {
      const id = problemLabel(index);
      return {
        id,
        title: challenge.title,
        solved: solvedByProblem.get(id) ?? 0,
        total: baseRows.length,
      };
    }),
    rows,
  };
}

leaderboardRouter.get("/live/:contestId", async (req: Request, res: Response) => {
  const contestId = req.params.contestId!;
  const contest = await prisma.contest.findFirst({
    where: { id: contestId, isDeleted: false },
    select: { startsAt: true, duration: true },
  });

  if (!contest) return res.status(404).json({ message: "contest not found" });
  if (Date.now() >= contestEndTime(contest)) {
    return res.status(409).json({ message: "contest has ended, use stale leaderboard" });
  }

  const payload = await buildLeaderboardPayload(contestId, "live");
  res.json(payload);
});

leaderboardRouter.get("/live/:contestId/stream", async (req: Request, res: Response) => {
  const contestId = req.params.contestId!;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendEvent = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: "connected" });

  const messageHandler = (message: string) => {
    try {
      sendEvent(JSON.parse(message));
    } catch {
      sendEvent({ type: "leaderboardUpdated" });
    }
  };

  await pubSub.subscribe(leaderboardChannel(contestId), messageHandler);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", async () => {
    clearInterval(heartbeat);
    await pubSub.unsubscribe(leaderboardChannel(contestId), messageHandler);
    res.end();
  });
});

leaderboardRouter.get("/stale/:contestId", async (req: Request, res: Response) => {
  const contestId = req.params.contestId!;
  const contest = await prisma.contest.findFirst({
    where: { id: contestId, isDeleted: false },
    select: { startsAt: true, duration: true },
  });

  if (!contest) return res.status(404).json({ message: "contest not found" });
  if (Date.now() < contestEndTime(contest)) {
    return res.status(409).json({ message: "contest is still live, use live leaderboard" });
  }

  const existing = await prisma.contestLeaderboardSnapshot.findUnique({
    where: { contestId },
  });

  if (existing) return res.json(existing.data);

  const payload = await buildLeaderboardPayload(contestId, "static");
  if (!payload) return res.status(404).json({ message: "contest not found" });

  const snapshot = await prisma.contestLeaderboardSnapshot.upsert({
    where: { contestId },
    update: { data: payload as any },
    create: { contestId, data: payload as any },
  });

  await prisma.contestResult.updateMany({
    where: { contestId },
    data: { status: "ENDED" },
  });

  res.json(snapshot.data);
});
