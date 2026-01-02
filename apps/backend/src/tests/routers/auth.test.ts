import { beforeAll, describe, expect, it } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { signinInvalidInputs, signupInvalidInputs } from "../lib/utils";
import { createUser } from "../helpers/user";
import { resetDb } from "../helpers/resetDb";


describe("POST /signup", () => {
  it.concurrent.for(signupInvalidInputs)("should return 400 when $statement | username=$username | email=$email | password=$password", async ({ statement, email, username, password }, ctx) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username,
      email,
      password
    });

    ctx.expect(res.status).toBe(400);
    ctx.expect(res.data).toStrictEqual({
      message: "invalid inputs"
    });
  });

  it("should successfully create a new user with valid inputs", async () => {
    const validUser = {
      username: "testuser",
      email: "nagmaniprasad25@gmail.com",
      password: "test123456"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, validUser);

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      message: "Email sent , please verify with otp",
      userId: expect.any(String)
    });

  });

  it("should return 403 when trying to signup with an email that already exists", async () => {
    const duplicateUser = {
      username: "duplicate",
      email: "zafarxdev@gmail.com",
      password: "pass123456"
    };

    const firstRes = await axios.post(`${BACKEND_URL}/api/auth/signup`, duplicateUser);
    expect(firstRes.status).toBe(200);

    const secondRes = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username: "different-username",
      email: "zafarxdev@gmail.com", // Same email
      password: "pass4563223"
    });

    expect(secondRes.status).toBe(403);
    expect(secondRes.data).toStrictEqual({
      message: "user already exists"
    });
  });
});


describe("POST /signin", () => {
  //INFO: I should avoid database operation in test , but don't have any option right now , how do i get otp ?

  beforeAll(async () => {
    await resetDb();
  });

  it.concurrent.for(signinInvalidInputs)("should return 400 when $statement | email=$email | password=$password", async ({ email, password }, ctx) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
      email,
      password
    });

    ctx.expect(res.status).toBe(400);
    ctx.expect(res.data).toStrictEqual({
      message: "invalid inputs"
    });
  });

  it("should return 404 when trying to signin for a user which does not exist", async () => {
    const nonExistentUser = {
      email: "nonexistent@example.com",
      password: "password123"
    };

    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, nonExistentUser);

    expect(res.status).toBe(404);
    expect(res.data).toStrictEqual({
      message: "user doesn't exist"
    });
  });

  /*
  it("should return 200 when trying to signin for a user which does exist with valid credentials", async () => {
    const user = {
      email: "randomboy123@gmail.com",
      password: "randomboy123",
      username: "randomBoy"
    }
    await createUser(user);

    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, user);
    console.log(res);
    expect(res.status).toBe(200);
    expect(res.data.message).toBe("signin successful");
    expect(res.data.token).toBeDefined()
  })
   * */

  it("should return 403 when trying to signin for a user which does exist with invalid credentials", async () => {

    const user = {
      email: "nagmani@gmail.com",
      password: "123random",
      username: "nagmani"
    }
    await createUser(user);

    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
      ...user,
      password: "456random"
    });
    expect(res.status).toBe(403);
    expect(res.data).toStrictEqual({
      message: "invalid password"
    });

  })
});

/*
INFO: no idea how to get otp
describe("POST /verify-otp/:userId", () => {
}
*/


describe("GET /me", () => {
  beforeAll(async () => {
    await resetDb();
  });
  it("", async () => {
    const user = {
      email: "randomboy123@gmail.com",
      password: "randomboy123",
      username: "randomBoy"
    }

    await createUser(user);

    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, user);

  })
});


