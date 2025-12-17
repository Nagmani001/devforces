//WARNING: fix: typescript issues

import prisma from "@repo/db/client";
import axios2 from "axios";
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

export const axios = {
  post: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.post(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  },

  get: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.get(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  },

  put: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.put(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  },

  delete: async (...args: any) => {
    try {
      //@ts-ignore
      const res = await axios2.delete(...args);
      return res;
    } catch (e: any) {
      return e.response;
    }
  }

};
