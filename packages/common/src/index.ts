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

export const frogotPasswordSchema = z.object({
  email: z.email()
});
/*
    user: UserCreateNestedOneWithoutChallengesInput
    challengeResult?: ChallengeResultCreateNestedOneWithoutChallengeInput
 * */

export const challengesSchema = z.object({
  title: z.string(),
  notionLink: z.string(),
  testFile: z.string(),
  dockerComposeFile: z.string(),
  startupScript: z.string(),
  totalTestCases: z.number(),
});

export const createContestSchema = z.object({
  title: z.string(),
  duration: z.number(), // seconds
  startsAt: z.date(),
  challenges: z.array(challengesSchema)
});


export const updateChallengesSchema = z.object({
  title: z.string().optional(),
  notionLink: z.string().optional(),
  testFile: z.string().optional(),
  dockerComposeFile: z.string().optional(),
  startupScript: z.string().optional(),
  totalTestCases: z.number().optional(),
});

export const updateContestSchema = z.object({
  title: z.string().optional(),
  duration: z.number().optional(), // seconds
  startsAt: z.date().optional(),
  challenges: z.array(challengesSchema).optional()
});
