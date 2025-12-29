import { describe, expect, it } from "vitest";
import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { signupInvalidInputs } from "../lib/utils";


describe("POST /signup", () => {
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


  /*
  it("should send otp when sent correct inputs", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username: "nagmani",
      email: "nagmanipd3@gmail.com",
      password: "nagmani"
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toBe("Email sent , please verify with otp");
    expect(res.data.userId).toBeDefined();
  });

  it("should return with 403 when sent same data again ", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      username: "nagmani",
      email: "nagmanipd3@gmail.com",
      password: "nagmani"
    });

    expect(res.status).toBe(403);
    expect(res.data).toStrictEqual({
      message: "user already exists"
    });
  });
   * */
});


/*
describe("POST /signin", () => {
  it("should return with 400 when sent wrong inputs", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
      email: "nagmani",
      password: "nagmani"
    });

    expect(res.status).toBe(400);
    expect(res.data).toStrictEqual({
      message: "invalid inputs"
    });
  });

  it("should return with 404 when sent credentials which is not a user", async () => {

    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
      email: "nagmani@gmail.com",
      password: "nagmani"
    });

    expect(res.status).toBe(404);
    expect(res.data).toStrictEqual({
      message: "user doesn't exist"
    });
  });

  it("should return with 403 when sent wrong credentials", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
      email: "nagmanipd3@gmail.com",
      password: "nagmaniupadhyay"
    });

    expect(res.status).toBe(403);
    expect(res.data).toStrictEqual({
      message: "invalid password"
    });
  });

  it("should return with 200 when sent correct credentials", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
      email: "nagmanipd3@gmail.com",
      password: "nagmani"
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toBe("signin successful");
    expect(res.data.token).toBeDefined();
  });
});
 * */
