import express from "express";
import { config } from "dotenv";
import { authRouter } from "./routes/authRouter";
import { adminContestRouter } from "./routes/adminContestRouter";
import { userContestRouter } from "./routes/userContestRouter";

config();
const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin/contest", adminContestRouter);
app.use("/api/user/contest", userContestRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
