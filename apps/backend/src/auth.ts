import { betterAuth, APIError, BASE_ERROR_CODES } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import prisma from "@repo/db/client";
import { sendEmail } from "@repo/email/email";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "nagmanipd3@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    "http://localhost:7000",
    "https://devforces.nagmani.site",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 5,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  ...(googleClientId && googleClientSecret
    ? {
      socialProviders: {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      },
    }
    : {}),
  session: {
    expiresIn: 60 * 60 * 24 * 15,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
      },
      isAdmin: {
        type: "boolean",
        defaultValue: false,
      },
    },
    fields: {
      image: "imageUrl",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = (user.email || "").toLowerCase();
          const data = user as unknown as Record<string, unknown>;
          const username =
            (typeof data.username === "string" && data.username) ||
            user.email?.split("@")[0] ||
            "user";
          return {
            data: {
              ...user,
              username,
              isAdmin: ADMIN_EMAILS.includes(email),
            },
          };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const body = ctx.body as { email?: string } | undefined;
        const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;
        if (email) {
          const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true },
          });
          if (existingUser) {
            throw APIError.from(
              "UNPROCESSABLE_ENTITY",
              BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL,
            );
          }
        }
      }
    }),
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const response = await sendEmail(
            otp,
            email,
            type === "forget-password" ? "FORGOT_PASSWORD" : "OTP"
          );
          if (response && !response.success) {
            console.error(`failed to send ${type} otp email to ${email}: ${response.message}`);
          }
        } catch (err) {
          console.error(`error sending ${type} otp email to ${email}`, err);
        }
      },
    }),
  ],
});
