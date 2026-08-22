import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
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
    "http://localhost:3000",
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
