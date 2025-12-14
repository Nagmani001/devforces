import express from "express";
import { config } from "dotenv";
import { authRouter } from "./routes/authRouter";
import { adminContestRouter } from "./routes/adminContestRouter";
import { userContestRouter } from "./routes/userContestRouter";
import { authMiddleware } from "./middlewares/authMiddleware";

config();
const app = express();

declare global {
  namespace Express {
    interface Request {
      userId: string | null
    }
  }
}
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin/contest", authMiddleware, adminContestRouter);
app.use("/api/user/contest", authMiddleware, userContestRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
