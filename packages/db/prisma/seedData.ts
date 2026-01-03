// actual password = itsboy
const hashedPassword = "$2b$10$iGcAyCg/LqVLFE0p17ZA0eOR5L3zj5GoY4IvN7zkhBWnQfyhtYdDe";

export const userDatas = [{
  username: "nagmani",
  email: "nagmanipd3@gmail.com",
  password: hashedPassword,
  otp: "123456",
  otpExpiry: new Date(),
  isAdmin: true,
  isVerified: true,
},
{
  username: "nagmani",
  email: "nagmaniprasad25@gmail.com",
  password: hashedPassword,
  otp: "654321",
  otpExpiry: new Date(),
  isAdmin: false,
  isVerified: true,
}
];

const now = new Date();
const fiveHoursInSeconds = 5 * 60 * 60; // 5 hours in seconds
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

export const contestDatas = [
  {
    title: "Live Express.js & PostgreSQL Challenge",
    subtitle: "Build a REST API with database integration",
    duration: fiveHoursInSeconds,
    startsAt: now,
  },
  {
    title: "Past Node.js Fundamentals Contest",
    subtitle: "Test your backend development skills",
    duration: fiveHoursInSeconds,
    startsAt: twoDaysAgo,
  },
  {
    title: "Upcoming Database Design Challenge",
    subtitle: "Master database schema and queries",
    duration: fiveHoursInSeconds,
    startsAt: twoDaysLater,
  }
];

const testFileContent = `import axios2 from "axios";
import { describe, expect, it } from "vitest";


const axios = {
  post: async (...args: any) => {
    try {

      //@ts-ignore
      const res = await axios2.post(...args)
      return res
    } catch (e: any) {
      return e.response
    }
  },
  //@ts-ignore
  get: async (...args) => {
    try {

      //@ts-ignore
      const res = await axios2.get(...args)
      return res
    } catch (e: any) {
      return e.response
    }
  },
  put: async (...args: any) => {
    try {

      //@ts-ignore
      const res = await axios2.put(...args)
      return res
    } catch (e: any) {
      return e.response
    }
  },
  delete: async (...args: any) => {
    try {

      //@ts-ignore
      const res = await axios2.delete(...args)
      return res
    } catch (e: any) {
      return e.response
    }
  },
}

describe("POST /todo", () => {
  it("should add todo", async () => {
    const response = await axios.post("http://localhost:8000/todo", {
      title: "title",
      description: "description"
    });

    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      msg: "todo pused successfully"
    });
  });
});


describe("GET /", () => {
  it("should get todos", async () => {
    const response = await axios.get("http://localhost:8000/todos");
    expect(response.status).toBe(400);
  });
});`;

export const challengeDatas = [
  {
    title: "Build a Todo API with Database",
    notionLink: "https://www.notion.so/Projects-2ce674d192f88024b3aec88fe8d21dcc?source=copy_link", // dummy
    testFile: testFileContent,
    baseGithubUrl: "https://github.com/Nagmani001/with-database",
    totalTestCases: 2,
    contestIndex: 0,
  }
];
