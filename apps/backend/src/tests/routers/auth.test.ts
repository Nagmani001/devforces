import { describe, expect, it, afterAll } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { signupInvalidInputs } from "../lib/utils";
import prisma from "@repo/db/client";


describe("POST /signup", () => {
  // Cleanup test users after all tests complete
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "valid-signup@example.com",
            "duplicate@example.com",
            "admin-test@example.com",
            "regular-user@example.com",
            "hash-test@example.com",
            "otp-test@example.com",
            "userid-test@example.com",
            "trim-test@example.com",
            "min-username@example.com",
            "max-username@example.com",
          ]
        }
      }
    });
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

  // Test Case 2: Duplicate user - user already exists
  it("should return 403 when trying to signup with an email that already exists", async () => {
    const duplicateUser = {
      username: "duplicate",
      email: "duplicate@example.com",
      password: "pass123"
    };

    // First signup - should succeed
    const firstRes = await axios.post(`${BACKEND_URL}/api/auth/signup`, duplicateUser);
    expect(firstRes.status).toBe(200);

    // Second signup with same email - should fail
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

  // Test Case 3: Admin user creation
  it("should create an admin user when email is nagmanipd3@gmail.com", async () => {
    // First cleanup if exists
    await prisma.user.deleteMany({
      where: { email: "nagmanipd3@gmail.com" }
    });

    const adminUser = {
      username: "admin",
      email: "nagmanipd3@gmail.com",
      password: "admin123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, adminUser);

    expect(res.status).toBe(200);

    // Verify admin flag is set
    const user = await prisma.user.findFirst({
      where: { email: adminUser.email }
    });

    expect(user?.isAdmin).toBe(true);
  });

  // Test Case 4: Regular user creation (not admin)
  it("should create a regular user (not admin) for other emails", async () => {
    const regularUser = {
      username: "regular",
      email: "regular-user@example.com",
      password: "pass123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, regularUser);

    expect(res.status).toBe(200);

    // Verify admin flag is false
    const user = await prisma.user.findFirst({
      where: { email: regularUser.email }
    });

    expect(user?.isAdmin).toBe(false);
  });

  // Test Case 5: Password is hashed
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

    // Password should NOT be stored in plain text
    expect(dbUser?.password).not.toBe(user.password);

    // Password should be a bcrypt hash (starts with $2b$ and is 60 chars)
    expect(dbUser?.password).toMatch(/^\$2[aby]\$.{56}$/);
  });

  // Test Case 6: OTP is generated and set correctly
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

    // OTP should be a 6-digit string
    expect(dbUser?.otp).toMatch(/^\d{6}$/);

    // OTP expiry should be approximately 1 minute from now
    const otpExpiry = dbUser?.otpExpiry;
    expect(otpExpiry).toBeInstanceOf(Date);

    // Should be between 55-65 seconds from signup time (allowing some variance)
    const expiryDiffMs = otpExpiry!.getTime() - beforeSignup.getTime();
    const expiryDiffSeconds = expiryDiffMs / 1000;

    expect(expiryDiffSeconds).toBeGreaterThanOrEqual(55);
    expect(expiryDiffSeconds).toBeLessThanOrEqual(65);
  });

  // Test Case 7: Response contains userId
  it("should return userId in the response", async () => {
    const user = {
      username: "useridtest",
      email: "userid-test@example.com",
      password: "pass123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, user);

    expect(res.data.userId).toBeDefined();
    expect(typeof res.data.userId).toBe("string");

    // Verify the userId matches the database
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email }
    });

    expect(res.data.userId).toBe(dbUser?.id);
  });

  // Test Case 8: Username trimming (Zod validation)
  it("should trim whitespace from username", async () => {
    const user = {
      username: "  trimtest  ",
      email: "trim-test@example.com",
      password: "pass123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, user);

    expect(res.status).toBe(200);

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email }
    });

    expect(dbUser?.username).toBe("trimtest"); // Trimmed
  });
});


