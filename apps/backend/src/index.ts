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
import { profileRouter } from "./routes/profileRouter";
import { initEmail } from "@repo/email/email";
import { initStorage } from "@repo/storage/storage";



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
  origin: ["http://localhost:7000", "https://devforces.nagmani.site"],
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
app.use("/api/profile", authMiddleware, profileRouter);



async function main() {
  let server = app.listen(7001, () => {
    console.log("Server is running on port 7001");
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

  if (process.env.RESEND_API_KEY) {
    initEmail(process.env.RESEND_API_KEY);
  }

  if (process.env.OBJECT_STORE_PROVIDER === "gcs") {
    const gcsCredentials = process.env.GCS_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)
      : undefined;

    initStorage("gcs", {
      bucket: process.env.GCS_BUCKET!,
      ...(process.env.GCS_PROJECT_ID ? { projectId: process.env.GCS_PROJECT_ID } : {}),
      ...(gcsCredentials ? { credentials: gcsCredentials } : {}),
      ...(process.env.GCS_SERVICE_ACCOUNT_KEY_PATH
        ? { keyFilename: process.env.GCS_SERVICE_ACCOUNT_KEY_PATH }
        : {}),
      ...(process.env.GCS_PUBLIC_BASE_URL
        ? { publicBaseUrl: process.env.GCS_PUBLIC_BASE_URL }
        : {}),
    });
  } else {
    initStorage("s3", {
      region: process.env.S3_REGION ?? "ap-south-1",
      bucket: process.env.S3_BUCKET ?? "nagmanidevforces",
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
        : {}),
      ...(process.env.S3_PUBLIC_BASE_URL
        ? { publicBaseUrl: process.env.S3_PUBLIC_BASE_URL }
        : {}),
    });
  }

}

main();
