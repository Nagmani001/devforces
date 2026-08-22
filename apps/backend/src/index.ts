import { config } from "dotenv";
config();

import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { adminContestRouter } from "./routes/adminContestRouter";
import { userContestRouter } from "./routes/userContestRouter";
import { authMiddleware } from "./middlewares/authMiddleware";
import { submitRouter } from "./routes/submitRouter";
import { createClient, RedisClientType } from "redis";
import { leaderboardRouter } from "./routes/leaderboardRouter";
import { notificationRotuer } from "./routes/notificationRouter";
import { sseRouter } from "./routes/sseRouter";
import { initEmail } from "@repo/email/email";


if (process.env.RESEND_API_KEY) {
  initEmail(process.env.RESEND_API_KEY);
}
const app = express();

export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

export const pubSub: RedisClientType = createClient({
  url: process.env.REDIS_URL
});



declare global {
  namespace Express {
    interface Request {
      userId: string | null
    }
  }
}

app.use(cors({
  origin: ["http://localhost:3000", "https://devforces.nagmani.site"],
  credentials: true
}));

app.get("/health", (req: Request, res: Response) => {
  res.json({
    message: "healthy",
  });
});

// better-auth must be mounted before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

app.use("/api/admin/contest", authMiddleware, adminContestRouter);
app.use("/api/user/contest", authMiddleware, userContestRouter);
app.use("/api/submissions", authMiddleware, submitRouter);
app.use("/api/notification", authMiddleware, notificationRotuer);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/live", sseRouter);



async function main() {
  let server = app.listen(3001, () => {
    console.log("Server is running on port 3001");
  });

  await redisClient.connect();
  console.log("connected to redis");

  await pubSub.connect();
  console.log("connected to pubSub");


  redisClient.on("error", (err: any) => {
    server.close(() => {
      process.exit(1);
    })

  });

  pubSub.on("error", (err: any) => {
    server.close(() => {
      process.exit(1);
    })
  });
}

main();
