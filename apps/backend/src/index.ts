import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { authRouter } from "./routes/authRouter";
import { adminContestRouter } from "./routes/adminContestRouter";
import { userContestRouter } from "./routes/userContestRouter";
import { authMiddleware } from "./middlewares/authMiddleware";
import { submitRouter } from "./routes/submitRouter";
import { createClient, RedisClientType } from "redis";

config();
const app = express();
export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

export const pubSub: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

export const soortedSetClient: RedisClientType = createClient({
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


async function main() {
  app.listen(3001, () => {
    console.log("Server is running on port 3001");
  });
  await redisClient.connect();
  console.log("connected to redis");

  await pubSub.connect();
  console.log("connected to pubSub");

  await soortedSetClient.connect();
  console.log("connected to redis sorted set");
}

main();
