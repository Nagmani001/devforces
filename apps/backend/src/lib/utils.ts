import prisma from "@repo/db/client";
import { Response } from "express";

export function unauthorized(res: Response) {
  return res.status(403).json({
    message: "invalid auth"
  })
}

export async function checkUserIsAdmin(userId: string, res: Response) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId
      }
    });
    return user?.isAdmin;

  } catch (err) {
    return res.status(500).json({
      message: "error occured during database fetching"
    });
  }
}
