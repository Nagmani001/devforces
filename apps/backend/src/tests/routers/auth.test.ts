import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { signupInvalidInputs } from "../lib/utils";
import prisma from "@repo/db/client";
import { resetDb } from "../helpers/resetDb";


describe("POST /signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  //WARNING: use it.for , since it comes with an additional feature to integrate TestContext
  it.each(signupInvalidInputs)("should return 400 when $statement | username=$username | email=$email | password=$password", async ({ statement, email, username, password }) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username,
      email,
      password
    });

    expect(res.status).toBe(400);
    expect(res.data).toStrictEqual({
      message: "invalid inputs"
    });
  });

  //BUG:  Flakey test , sometime all of these pass , sometime some fail  
  // this is because of shared shate / concurrency . the way vitest runs the test for you
  // Figure it out
  /*
  it("should successfully create a new user with valid inputs", async () => {
    const validUser = {
      username: "testuser",
      email: "valid-signup@example.com",
      password: "test123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, validUser);

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      message: "Email sent , please verify with otp",
      userId: expect.any(String)
    });

    const user = await prisma.user.findFirst({
      where: { email: validUser.email }
    });

    expect(user).toBeTruthy();
    expect(user?.username).toBe(validUser.username);
    expect(user?.email).toBe(validUser.email);
    expect(user?.isVerified).toBe(false);
    expect(user?.otp).toBeTruthy();
    expect(user?.otpExpiry).toBeInstanceOf(Date);
    expect(user?.password).not.toBe(validUser.password); // Password should be hashed
  });

  it("should return 403 when trying to signup with an email that already exists", async () => {
    const duplicateUser = {
      username: "duplicate",
      email: "duplicate@example.com",
      password: "pass123"
    };

    const firstRes = await axios.post(`${BACKEND_URL}/api/auth/signup`, duplicateUser);
    expect(firstRes.status).toBe(200);

    const secondRes = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username: "different-username",
      email: "duplicate@example.com", // Same email
      password: "pass456"
    });

    expect(secondRes.status).toBe(403);
    expect(secondRes.data).toStrictEqual({
      message: "user already exists"
    });
  });

  it("should create an admin user when email is nagmanipd3@gmail.com", async () => {
    const adminUser = {
      username: "admin",
      email: "nagmanipd3@gmail.com",
      password: "admin123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, adminUser);

    expect(res.status).toBe(200);

    const user = await prisma.user.findFirst({
      where: { email: adminUser.email }
    });

    expect(user?.isAdmin).toBe(true);
  });

  it("should create a regular user (not admin) for other emails", async () => {
    const regularUser = {
      username: "regular",
      email: "regular-user@example.com",
      password: "pass123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, regularUser);

    expect(res.status).toBe(200);

    const user = await prisma.user.findFirst({
      where: { email: regularUser.email }
    });

    expect(user?.isAdmin).toBe(false);
  });

  it("should hash the password before storing in database", async () => {
    const user = {
      username: "hashtest",
      email: "hash-test@example.com",
      password: "plaintext123"
    };

    await axios.post(`${BACKEND_URL}/api/auth/signup`, user);

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email }
    });

    expect(dbUser?.password).not.toBe(user.password);
    expect(dbUser?.password).toMatch(/^\$2[aby]\$.{56}$/);
  });

  it("should generate a 6-digit OTP and set expiry to approximately 1 minute", async () => {
    const user = {
      username: "otptest",
      email: "otp-test@example.com",
      password: "pass123"
    };

    const beforeSignup = new Date();
    await axios.post(`${BACKEND_URL}/api/auth/signup`, user);

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email }
    });

    expect(dbUser?.otp).toMatch(/^\d{6}$/);

    const otpExpiry = dbUser?.otpExpiry;
    expect(otpExpiry).toBeInstanceOf(Date);

    const expiryDiffMs = otpExpiry!.getTime() - beforeSignup.getTime();
    const expiryDiffSeconds = expiryDiffMs / 1000;

    expect(expiryDiffSeconds).toBeGreaterThanOrEqual(55);
    expect(expiryDiffSeconds).toBeLessThanOrEqual(65);
  });

  it("should return userId in the response", async () => {
    const user = {
      username: "useridtest",
      email: "userid-test@example.com",
      password: "pass123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, user);

    expect(res.data.userId).toBeDefined();
    expect(typeof res.data.userId).toBe("string");

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email }
    });

    expect(res.data.userId).toBe(dbUser?.id);
  });
   * */

});


