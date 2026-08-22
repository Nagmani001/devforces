import { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";

declare global {
  namespace Express {
    interface Request {
      authSession: typeof auth.$Infer.Session | null;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(403).json({
        message: "invalid token"
      });
    }

    req.userId = session.user.id;
    req.authSession = session;
    next();
  } catch (err) {
    return res.status(403).json({
      message: "invalid token"
    });
  }
}
