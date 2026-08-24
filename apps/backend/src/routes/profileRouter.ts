import { Router, Response, Request } from "express";
import prisma from "@repo/db/client";
import { unauthorized } from "../lib/utils";
import { createUploadUrl, getDownloadUrl } from "@repo/storage/storage";

export const profileRouter: Router = Router();

function toDateKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

type SolvedEntry = { userId: string; challengeId: string; date: Date };

// computes challenges solved + global rank for a given user
async function computeSolvedAndRank(userId: string) {
  // ChallengeResult has a globally unique challengeId, so each row is a distinct challenge.
  // A challenge counts as solved when score reaches its totalTestCases.
  const allResults = await prisma.challengeResult.findMany({
    select: {
      userId: true,
      challengeId: true,
      score: true,
      challenge: { select: { totalTestCases: true } },
    },
  });

  const isSolved = (r: (typeof allResults)[number]) => r.score >= r.challenge.totalTestCases;

  const solvedByUser = new Map<string, SolvedEntry[]>();
  for (const r of allResults) {
    if (!isSolved(r)) continue;
    if (!solvedByUser.has(r.userId)) solvedByUser.set(r.userId, []);
    solvedByUser.get(r.userId)!.push({ userId: r.userId, challengeId: r.challengeId, date: new Date() });
  }

  const mySolved = solvedByUser.get(userId) ?? [];

  // rank = 1 + number of users strictly ahead (more solved)
  let rank = 1;
  for (const [uid, list] of solvedByUser) {
    if (uid === userId) continue;
    if (list.length > mySolved.length) rank++;
  }

  return { solvedCount: mySolved.length, globalRank: rank };
}

function buildStreak(sessions: { createdAt: Date }[]) {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const key = toDateKey(s.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // activity grid for the last 12 months (for the heatmap)
  const activity: { date: string; count: number }[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = toDateKey(d);
    activity.push({ date: key, count: counts.get(key) ?? 0 });
  }

  // current streak (consecutive days with activity, ending today or yesterday)
  let currentStreak = 0;
  let cursor = new Date(today);
  if (!counts.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1); // allow streak ending yesterday
  while (counts.has(toDateKey(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest streak
  let longest = 0;
  let running = 0;
  const sorted = [...activity].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sorted) {
    if (day.count > 0) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  return { currentStreak, longestStreak: longest, activity };
}

profileRouter.get("/avatar/upload-url", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  try {
    const key = `${userId}-avatar-${Date.now()}`;
    const { url, method, fields, headers } = await createUploadUrl({
      key,
      contentType: "image/*",
      maxSizeBytes: 5 * 1024 * 1024,
      expiresInSeconds: 3600,
    });
    res.json({ url, method, fields: fields ?? {}, headers: headers ?? {}, key, publicUrl: getDownloadUrl(key) });
  } catch (err) {
    console.error("error creating avatar upload url", err);
    return res.status(500).json({ message: "error while creating upload url" });
  }
});

profileRouter.get("/me", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        imageUrl: true,
        isAdmin: true,
        description: true,
        location: true,
        skills: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const [contestsAttended, solvedData, sessions] = await Promise.all([
      prisma.contestResult.count({ where: { userId } }),
      computeSolvedAndRank(userId),
      prisma.submissionSession.findMany({
        where: { userId },
        select: { createdAt: true },
      }),
    ]);

    const streak = buildStreak(sessions);

    // recent activity
    const recentSessions = await prisma.submissionSession.findMany({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { challengeId: true, contestId: true, createdAt: true },
    });

    const challengeIds = [...new Set(recentSessions.map((s) => s.challengeId))];
    const contestIds = [...new Set(recentSessions.map((s) => s.contestId))];

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

    const recentActivity = recentSessions.map((s) => ({
      type: "submission" as const,
      challenge: challengeTitle.get(s.challengeId) ?? "Unknown challenge",
      contest: contestTitle.get(s.contestId) ?? "Unknown contest",
      createdAt: s.createdAt,
    }));

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        imageUrl: user.imageUrl,
        isAdmin: user.isAdmin,
        description: user.description,
        location: user.location,
        skills: user.skills,
        joinedAt: user.createdAt,
      },
      stats: {
        contestsAttended,
        challengesSolved: solvedData.solvedCount,
        globalRank: solvedData.globalRank,
      },
      streak,
      recentActivity,
    });
  } catch (err) {
    console.error("error fetching profile", err);
    return res.status(500).json({ message: "error while fetching profile" });
  }
});

profileRouter.patch("/me", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return unauthorized(res);

  const { description, location, skills, imageUrl } = req.body ?? {};

  const data: { description?: string; location?: string; skills?: string[]; imageUrl?: string } = {};

  if (typeof description === "string") data.description = description;
  if (typeof location === "string") data.location = location;
  if (Array.isArray(skills)) {
    data.skills = skills.filter((s) => typeof s === "string").slice(0, 20);
  }
  if (typeof imageUrl === "string" && imageUrl.trim()) data.imageUrl = imageUrl.trim();

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "nothing to update" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        description: true,
        location: true,
        skills: true,
        imageUrl: true,
      },
    });
    res.json({ user });
  } catch (err) {
    console.error("error updating profile", err);
    return res.status(500).json({ message: "error while updating profile" });
  }
});
