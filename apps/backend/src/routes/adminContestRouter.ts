import { Router, Response, Request } from "express";

export const adminContestRouter: Router = Router();

adminContestRouter.get("/", (req: Request, res: Response) => {
  // get all contests which that admin has created
  // pagination and all 
});


adminContestRouter.post("/create", (req: Request, res: Response) => {
  // create a contest , with their admin name 

});

adminContestRouter.delete("/create/:id", (req: Request, res: Response) => {
  // delete a contest , only let them delete if they have create it 

});


adminContestRouter.put("/update", (req: Request, res: Response) => {
  // update a contest , only let them update if they have created it 

});
