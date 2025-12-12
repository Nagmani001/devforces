import { Router, Response, Request } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { otpSchema, signinSchema, signupSchema } from "../zodTypes";
import prisma from "@repo/db/client";
import { sendEmail } from "@repo/email/email";

export const authRouter: Router = Router();

authRouter.post("/signup", async (req: Request, res: Response) => {
  const parsedData = signupSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "invalid inputs"
    })
  }
  const { email, username, password } = parsedData.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const userExists = await prisma.user.findFirst({
    where: {
      email,
    }
  });

  if (userExists) {
    return res.status(403).json({
      message: "user already exists"
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  let otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 1);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username,
      otp: otp,
      otpExpiry: otpExpiry
    }
  });
  const response = await sendEmail(otp, email, "OTP");
  if (!response?.success) {
    return res.status(403).json(response);
  }

  res.json({
    message: "Email sent , please verify with otp",
    userId: user.id,
  });
});


authRouter.post("/signin", async (req: Request, res: Response) => {
  const parsedData = signinSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "invalid inputs"
    })
  }
  const { email, password } = parsedData.data;

  const user = await prisma.user.findFirst({
    where: {
      email,
    }
  });

  if (!user) {
    return res.status(404).json({
      message: "user doesn't exist"
    });
  }

  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    return res.status(403).json({
      message: "invalid password"
    });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "nagmani", { expiresIn: "15d" });
  res.json({
    message: "signin successful",
    token
  });
});

authRouter.post("/verify-otp/:userId", async (req: Request, res: Response) => {
  const parsedData = otpSchema.safeParse(req.body);
  const userId = req.params.userId;

  if (!parsedData.success || !userId) {
    return res.status(400).json({
      message: "invalid inputs"
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      id: Number(userId)
    }
  });
  if (user?.otp != parsedData.data.otp) {
    return res.status(403).json({
      message: "wrong otp"
    });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(410).json({
      message: "you are late"
    });
  }

  await prisma.user.update({
    where: {
      id: Number(userId)
    },
    data: {
      isVerified: true
    }
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "nagmani", { expiresIn: "15d" });
  res.json({
    message: "correct otp",
    token
  });
});

authRouter.post("/forgot-password", (req: Request, res: Response) => {

});
