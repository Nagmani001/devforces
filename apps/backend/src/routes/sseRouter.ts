import { Router, Request, Response } from "express";
import { pubSub } from "..";
import prisma from "@repo/db/client";
import { SSEMessage } from "@repo/common/typescript-types";

export const sseRouter: Router = Router();

sseRouter.get("/sse/:token", async (req: Request, res: Response) => {
  const token = req.params.token;

  // Validate token
  const session = await prisma.submissionSession.findFirst({
    where: {
      token: token,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!session) {
    res.status(404).json({ message: "Invalid or expired token" });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  // Send initial connection message
  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: "connected", message: "Connected to submission stream" });

  // Subscribe to Redis channel
  const messageHandler = (message: string, channel: string) => {
    if (channel === token) {
      try {
        const parsed: SSEMessage = JSON.parse(message);
        sendEvent(parsed);
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    }
  };




  // Set up message listener before subscribing
  //  pubSub.on('message', messageHandler);
  await pubSub.subscribe(token!, messageHandler);

  // Handle client disconnect
  req.on('close', async () => {
    console.log('Client closed SSE connection for token:', token);
    pubSub.off('message', messageHandler);
    await pubSub.unsubscribe(token);
    res.end();
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n');
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});
