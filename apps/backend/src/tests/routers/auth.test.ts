import { beforeAll, describe, expect, it } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { createUser } from "../helpers/user";
import { toCookieHeader } from "../helpers/auth";
import { resetDb } from "../helpers/resetDb";
import prisma from "@repo/db/client";

async function getLatestOtp(identifier: string) {
  const verification = await prisma.verification.findFirst({
    where: { identifier: { contains: identifier } },
    orderBy: { createdAt: "desc" },
  });
  return verification?.value.split(":")[0];
}

describe("POST /api/auth/sign-up/email", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should return 400 when email is invalid", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      name: "nagmani",
      email: "not-an-email",
      password: "password123",
      username: "nagmani"
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 when password is too short", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      name: "nagmani",
      email: "n@gmail.com",
      password: "1234",
      username: "nagmani"
    });

    expect(res.status).toBe(400);
  });

  it("should create a new user without a session since email is not verified", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      name: "testuser",
      email: "testuser@example.com",
      password: "testpass123",
      username: "testuser"
    });

    expect(res.status).toBe(200);
    expect(res.data.token).toBeNull();
    expect(res.data.user).toMatchObject({
      email: "testuser@example.com",
      emailVerified: false,
      username: "testuser",
      isAdmin: false
    });
  });

  it("should return a duplicate email error and not create a second user", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      name: "testuser",
      email: "testuser@example.com",
      password: "anotherpass123",
      username: "testuser"
    });

    const count = await prisma.user.count({
      where: { email: "testuser@example.com" }
    });

    expect(res.status).toBe(422);
    expect(res.data.code).toBe("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL");
    expect(res.data.message).toBe("User already exists. Use another email.");
    expect(count).toBe(1);
  });
});

describe("POST /api/auth/sign-in/email", () => {
  beforeAll(async () => {
    await resetDb();
    await createUser({
      email: "randomboy123@gmail.com",
      password: "randomboy123",
      username: "randomBoy"
    });
  });

  it("should return 401 when user does not exist", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-in/email`, {
      email: "nonexistent@example.com",
      password: "password123"
    });

    expect(res.status).toBe(401);
  });

  it("should return 401 when password is invalid", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-in/email`, {
      email: "randomboy123@gmail.com",
      password: "wrongpassword"
    });

    expect(res.status).toBe(401);
  });

  it("should sign in a verified user and return the session token header", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/sign-in/email`, {
      email: "randomboy123@gmail.com",
      password: "randomboy123"
    });

    expect(res.status).toBe(200);
    expect(res.data.user).toMatchObject({
      email: "randomboy123@gmail.com",
      emailVerified: true
    });
    expect(res.headers["set-cookie"]).toBeDefined();
  });
});

describe("email otp verification flow", () => {
  it("should verify email with otp, receive a token and use it on get-session", async () => {
    await resetDb();

    const email = "verifyboy@example.com";
    await axios.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      name: "verifyboy",
      email,
      password: "verifypass123",
      username: "verifyboy"
    });

    const otp = await getLatestOtp(email);
    expect(otp).toBeDefined();

    const verifyRes = await axios.post(`${BACKEND_URL}/api/auth/email-otp/verify-email`, {
      email,
      otp
    });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.status).toBe(true);
    const cookie = toCookieHeader(verifyRes.headers["set-cookie"]);
    expect(cookie).toContain("better-auth.session_token");

    const sessionRes = await axios.get(`${BACKEND_URL}/api/auth/get-session`, {
      headers: { Cookie: cookie }
    });

    expect(sessionRes.status).toBe(200);
    expect(sessionRes.data?.user).toMatchObject({
      email,
      username: "verifyboy",
      isAdmin: false
    });
  });
});
