import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({
      message: "token missing"
    })
  };

  try {
    //@ts-ignore
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "");

    //@ts-ignore
    req.userId = decoded.userId;
    next();

  } catch (err) {
    return res.status(403).json({
      message: "invalid token"
    })
  }

}
