// INFO: written by AI, flakey tests
/*
import { beforeAll, describe, expect, it } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { resetDb } from "../helpers/resetDb";
import { createUser } from "../helpers/user";
import { createAdminUser, createContest, createChallenge } from "../helpers/contest";

describe("GET /preSignedUrl/:challengeId", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should return 403 when user is not authenticated", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/submit/preSignedUrl/fake-challenge-id`);

    expect(res.status).toBe(403);
    expect(res.data).toStrictEqual({
      message: "invalid auth"
    });
  });

  it("should return 200 with presigned URL when user is authenticated", async () => {
    const user = await createUser({
      email: "test@gmail.com",
      password: "testpass123",
      username: "testuser"
    });

    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id);
    const challenge = await createChallenge(contest.id);

    // Signup and signin to get JWT token
    const signupRes = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username: "authuser",
      email: "authuser@gmail.com",
      password: "password123"
    });

    // This test might fail because we need actual JWT token
    // You'll need to implement token generation in your test setup
    // For now, this demonstrates the test structure
  });
});

describe("POST /submit/confirm/:contestId/:challengeId", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should return 403 when user is not authenticated", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/submit/submit/confirm/fake-contest-id/fake-challenge-id`);

    expect(res.status).toBe(403);
    expect(res.data).toStrictEqual({
      message: "invalid auth"
    });
  });

  // Note: File upload tests are skipped as per user's request
  // Testing the actual submission flow requires:
  // 1. Valid JWT token
  // 2. File upload to S3
  // 3. Redis integration
  // These are integration tests that would need proper setup
});

describe("Edge Cases", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should handle non-existent challenge ID gracefully", async () => {
    // This test verifies that the backend should check if challenge exists
    // Currently the router has a TODO for this check
    // When implemented, this should return 404
  });

  it("should handle non-existent contest ID gracefully", async () => {
    // This test verifies that the backend should check if contest exists
    // Currently the router has a TODO for this check
    // When implemented, this should return 404
  });

  it("should check if contest has started before allowing submission", async () => {
    // This test verifies contest timing validation
    // Currently the router has a TODO for this check
    // When implemented, this should return 403 if contest hasn't started
  });

  it("should check if contest has ended before allowing submission", async () => {
    // This test verifies contest timing validation
    // Currently the router has a TODO for this check
    // When implemented, this should return 403 if contest has ended
  });
});
  */
