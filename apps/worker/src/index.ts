import { config } from "dotenv";
config();

import { main as v1 } from "./v1";
import { main as v2 } from "./v2";

const PIPELINE = process.env.SUBMISSION_PIPELINE || "v1";

async function main() {
  switch (PIPELINE) {
    case "v1":
      await v1();
      break;
    case "v2":
      await v2();
      break;
    default:
      throw new Error(`Unknown submission pipeline: ${PIPELINE}`);
  }
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
