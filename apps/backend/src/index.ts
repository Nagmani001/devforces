import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { authRouter } from "./routes/authRouter";
import { adminContestRouter } from "./routes/adminContestRouter";
import { userContestRouter } from "./routes/userContestRouter";
import { authMiddleware } from "./middlewares/authMiddleware";
import { submitRouter } from "./routes/submitRouter";
import { createClient, RedisClientType } from "redis";
import { leaderboardRouter } from "./routes/leaderboardRouter";
import { notificationRotuer } from "./routes/notificationRouter";
import { sseRouter } from "./routes/sseRouter";

config();
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
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));


app.use("/api/auth", authRouter);
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


  //TODO: DRY
  //INFO : did this since when i was running <docker compose down> in integration test , then backend was throwing error
  // there should be better way to solve this  since if redis stops i should not take down my backend in production 
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
