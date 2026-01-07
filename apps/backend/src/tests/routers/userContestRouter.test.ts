// INFO: written by AI, flakey tests
/*
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { resetDb } from "../helpers/resetDb";
import { createAdminUser, createContest, createChallenge } from "../helpers/contest";

describe("GET /", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should return empty array when no contests exist", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=1`);

    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual({
      contests: []
    });
  });

  it("should return contests for page 1", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    await createContest(admin.id, { title: "Contest 1" });
    await createContest(admin.id, { title: "Contest 2" });

    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=1`);

    expect(res.status).toBe(200);
    expect(res.data.contests).toHaveLength(2);
    expect(res.data.contests[0]).toHaveProperty("title");
    expect(res.data.contests[0]).toHaveProperty("_count");
  });

  it("should return 10 contests max per page", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    // Create 15 contests
    for (let i = 0; i < 15; i++) {
      await createContest(admin.id, { title: `Contest ${i}` });
    }

    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=1`);

    expect(res.status).toBe(200);
    expect(res.data.contests).toHaveLength(10);
  });

  it("should return correct contests for page 2", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    // Create 15 contests
    for (let i = 0; i < 15; i++) {
      await createContest(admin.id, { title: `Contest ${i}` });
    }

    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=2`);

    expect(res.status).toBe(200);
    expect(res.data.contests).toHaveLength(5);
  });

  it("should not return deleted contests", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    await createContest(admin.id, { title: "Active Contest" });
    await createContest(admin.id, { title: "Deleted Contest", isDeleted: true });

    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=1`);

    expect(res.status).toBe(200);
    expect(res.data.contests).toHaveLength(1);
    expect(res.data.contests[0].title).toBe("Active Contest");
  });

  it("should include challenge count", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id, { title: "Contest" });
    await createChallenge(contest.id, { title: "Challenge 1" });
    await createChallenge(contest.id, { title: "Challenge 2" });

    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=1`);

    expect(res.status).toBe(200);
    expect(res.data.contests[0]._count.challenges).toBe(2);
  });

  it("should handle invalid page parameter", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=invalid`);

    // This might cause issues - backend should validate page parameter
    // NaN page might cause unexpected behavior
  });

  it("should handle missing page parameter", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest`);

    // Backend should handle missing page parameter
    // Currently might result in NaN
  });

  it("should handle negative page parameter", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=-1`);

    // Backend should validate page >= 1
  });

  it("should handle page 0", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest?page=0`);

    // Backend should validate page >= 1
  });
});

describe("GET /:contestId/challenges", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should return empty array when contest has no challenges", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id);

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/${contest.id}/challenges`);

    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual({
      challenges: []
    });
  });

  it("should return all challenges for a contest", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id);
    await createChallenge(contest.id, { title: "Challenge 1" });
    await createChallenge(contest.id, { title: "Challenge 2" });

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/${contest.id}/challenges`);

    expect(res.status).toBe(200);
    expect(res.data.challenges).toHaveLength(2);
    expect(res.data.challenges[0]).toHaveProperty("title");
    expect(res.data.challenges[0]).toHaveProperty("totalTestCases");
  });

  it("should not expose notionLink and testFile", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id);
    await createChallenge(contest.id);

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/${contest.id}/challenges`);

    expect(res.status).toBe(200);
    expect(res.data.challenges[0]).not.toHaveProperty("notionLink");
    expect(res.data.challenges[0]).not.toHaveProperty("testFile");
  });

  it("should handle non-existent contest ID", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest/non-existent-id/challenges`);

    expect(res.status).toBe(200);
    expect(res.data.challenges).toHaveLength(0);
  });

  it("should handle invalid contest ID format", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest/invalid@id/challenges`);

    // Backend might throw database error
    // Should handle gracefully with 400 or 404
  });
});

describe("GET /challenge/:challengeId", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should return challenge details", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id);
    const challenge = await createChallenge(contest.id, {
      title: "Test Challenge",
      notionLink: "https://notion.so/test",
      baseGithubUrl: "https://github.com/test/repo"
    });

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/challenge/${challenge.id}`);

    expect(res.status).toBe(200);
    expect(res.data.challenge).toMatchObject({
      title: "Test Challenge",
      notionLink: "https://notion.so/test",
      baseGithubUrl: "https://github.com/test/repo"
    });
  });

  it("should not expose testFile field", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    const contest = await createContest(admin.id);
    const challenge = await createChallenge(contest.id);

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/challenge/${challenge.id}`);

    expect(res.status).toBe(200);
    expect(res.data.challenge).not.toHaveProperty("testFile");
  });

  it("should return null when challenge does not exist", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest/challenge/non-existent-id`);

    expect(res.status).toBe(200);
    expect(res.data.challenge).toBeNull();
  });

  it("should handle invalid challenge ID format", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest/challenge/invalid@id`);

    // Backend might throw database error
    // Should return 500 based on catch block
    expect(res.status).toBe(500);
    expect(res.data).toStrictEqual({
      message: "something went wrong"
    });
  });
});

describe("GET /totalPages", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should return 1 when no contests exist", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/user-contest/totalPages`);

    expect(res.status).toBe(200);
    expect(res.data.total).toBe(1);
  });

  it("should return 1 when less than 10 contests exist", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    for (let i = 0; i < 5; i++) {
      await createContest(admin.id);
    }

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/totalPages`);

    expect(res.status).toBe(200);
    expect(res.data.total).toBe(1);
  });

  it("should return correct page count for exactly 10 contests", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    for (let i = 0; i < 10; i++) {
      await createContest(admin.id);
    }

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/totalPages`);

    expect(res.status).toBe(200);
    expect(res.data.total).toBe(1);
  });

  it("should return correct page count for 15 contests", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    for (let i = 0; i < 15; i++) {
      await createContest(admin.id);
    }

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/totalPages`);

    expect(res.status).toBe(200);
    expect(res.data.total).toBe(2);
  });

  it("should return correct page count for 25 contests", async () => {
    const admin = await createAdminUser({
      email: "admin@gmail.com",
      password: "adminpass",
      username: "admin"
    });

    for (let i = 0; i < 25; i++) {
      await createContest(admin.id);
    }

    const res = await axios.get(`${BACKEND_URL}/api/user-contest/totalPages`);

    expect(res.status).toBe(200);
    expect(res.data.total).toBe(3);
  });
});

describe("POST /started/:contestId/:challengeId", () => {
  it("should exist but is not implemented", async () => {
    // This endpoint exists in the router but has no implementation
    // Tests should be added when the endpoint is implemented
  });
});
  */
