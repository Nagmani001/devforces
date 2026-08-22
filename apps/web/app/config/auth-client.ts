"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { BASE_URL } from "./utils";

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [emailOTPClient()],
});

export async function signInWithGoogle(callbackURL: string = "/contests/1") {
  const url = new URL(callbackURL, window.location.origin).href;
  return authClient.signIn.social({
    provider: "google",
    callbackURL: url,
  });
}
