import { Router, Response, Request } from "express";

export const userContestRouter: Router = Router();

userContestRouter.get("/", (req: Request, res: Response) => {
  // get all contests
  // pagination and all 

});


userContestRouter.get("/:id/challenges", (req: Request, res: Response) => {
  // get challenges of a specific contest
  // pagination and all 

});







