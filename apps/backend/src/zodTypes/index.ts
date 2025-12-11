import { z } from "zod";

export const signupSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string(),
});


export const signinSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const otpSchema = z.object({
  otp: z.string()
});
