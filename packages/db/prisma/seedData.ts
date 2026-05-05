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

const EVERLASTING_DURATION = 2147483647;

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
  },
  // ─── Everlasting Contests ───────────────────────────────────────────
  {
    title: "Express.js & File System Fundamentals",
    subtitle: "Build an HTTP server with file I/O, user management, and middleware",
    duration: EVERLASTING_DURATION,
    startsAt: now,
  },
  {
    title: "Todo Backend Mastery",
    subtitle: "Implement a full CRUD Todo API with filtering and persistence",
    duration: EVERLASTING_DURATION,
    startsAt: now,
  },
  {
    title: "Car Rental System Challenge",
    subtitle: "Build a car rental booking system with auth, bookings, and summaries",
    duration: EVERLASTING_DURATION,
    startsAt: now,
  },
];

// ─── Axios error-catching wrapper (reused across all test files) ────
const axiosWrapper = `import axios2 from "axios";
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
}`;

const testFileContent = `${axiosWrapper}

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

// ─── Test file for Contest 3 (index 3): File System Fundamentals ────
const fileSystemTestContent = `${axiosWrapper}

const BASE_URL = "http://localhost:8000";

describe("GET /", () => {
  it("should print welcome message", async () => {
    const response = await axios.get(\`\${BASE_URL}/\`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual("Welcome to my first Express or Actix server!");
  });
});

describe("GET /greet", () => {
  it("should greet the user with their name", async () => {
    const response = await axios.get(\`\${BASE_URL}/greet\`, {
      params: { name: "Nagmani" }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual("Hello Nagmani, nice to meet you!");
  });
});

describe("GET /write", () => {
  it("should write to a file", async () => {
    const response = await axios.get(\`\${BASE_URL}/write\`, {
      params: { message: "Learning Express or actix" }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual("wrote to file");
  });
});

describe("GET /append", () => {
  it("should append to a file", async () => {
    const response = await axios.get(\`\${BASE_URL}/append\`, {
      params: { message: "this needs to be appended" }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual("appended to file");
  });
});

describe("GET /read", () => {
  it("should read a file", async () => {
    const response = await axios.get(\`\${BASE_URL}/read\`);
    expect(response.status).toBe(200);
    expect(response.data.trim()).toEqual("Learning Express or actixthis needs to be appended");
  });
});

describe("GET /clear", () => {
  it("should clear all the contents of files", async () => {
    const response = await axios.get(\`\${BASE_URL}/clear\`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual("cleared");
  });
});

describe("GET /add-user", () => {
  it("should add user to users array", async () => {
    const response = await axios.get(\`\${BASE_URL}/add-user\`, {
      params: { name: "Nagmani", age: 20 }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual("User added successfully!");
  });
});

describe("GET /check-user", () => {
  it("blocks users with less age", async () => {
    const response = await axios.get(\`\${BASE_URL}/check-user\`, {
      params: { name: "Nagmani", age: 2 }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual("You are blocked as your age is less.");
  });

  it("allows user with proper age", async () => {
    const response = await axios.get(\`\${BASE_URL}/check-user\`, {
      params: { name: "Raman", age: 20 }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual("Access granted!");
  });
});

describe("GET /is-blocked", () => {
  it("should show blocked", async () => {
    const name = "Nagmani";
    const response = await axios.get(\`\${BASE_URL}/is-blocked?name=\${name}\`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual(\`\${name} is blocked.\`);
  });

  it("should show not blocked", async () => {
    const name = "Raman";
    const response = await axios.get(\`\${BASE_URL}/is-blocked\`, {
      params: { name }
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual(\`\${name} is not blocked.\`);
  });
});

describe("GET /users", () => {
  it("should return all users", async () => {
    const response = await axios.get(\`\${BASE_URL}/users\`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual([{ name: "Nagmani", age: 20 }]);
  });
});

describe("DELETE /clear-data", () => {
  it("should delete the in memory data", async () => {
    const response = await axios.get(\`\${BASE_URL}/clear-data\`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual("All data cleared successfully!");
  });
});`;

// ─── Test file for Contest 4 (index 4): Todo Backend Mastery ────────
const todoTestContent = `${axiosWrapper}

const BASE_URL = "http://localhost:8000";

describe("GET / initialize todo backend", () => {
  it("should initialize a todo array and greet the user", async () => {
    const response = await axios.get(\`\${BASE_URL}/\`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual("Welcome to TODO Backend!");
  });
});

describe("GET /todos (empty)", () => {
  it("todos currently doesn't exist so this should fail with 404", async () => {
    const response = await axios.get(\`\${BASE_URL}/todos\`);
    expect(response.status).toBe(404);
    expect(response.data).toStrictEqual({ message: "No TODOs found yet." });
  });
});

describe("GET /add-todo?task=Buy%20milk adds todo", () => {
  it("should add the todo to in memory variable", async () => {
    const response = await axios.get(\`\${BASE_URL}/add-todo\`, {
      params: { task: "Buy milk" }
    });
    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual({ message: "TODO added successfully!", todoCount: 1 });
  });
});

describe("GET /todos", () => {
  it("get all todos and return to user", async () => {
    const response = await axios.get(\`\${BASE_URL}/todos\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual([
      { id: 1, task: "Buy milk", completed: false }
    ]);
  });
});

describe("GET /todos/:id", () => {
  it("finds the todo with the todo id", async () => {
    const response = await axios.get(\`\${BASE_URL}/todo/1\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual(
      { id: 1, task: "Buy milk", completed: false }
    );
  });

  it("should return with 404 since todo doesn't exist", async () => {
    const response = await axios.get(\`\${BASE_URL}/todo/2\`);
    expect(response.status).toBe(404);
    expect(response.data).toStrictEqual({ error: "TODO not found" });
  });
});

describe("PUT /todos/:id/complete", () => {
  it("marks the todo as completed", async () => {
    const response = await axios.put(\`\${BASE_URL}/todos/1/complete\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      message: "TODO marked as completed!",
      todo: { id: 1, task: "Buy milk", completed: true }
    });
  });

  it("should return with 404 since todo doesn't exist", async () => {
    const response = await axios.put(\`\${BASE_URL}/todos/2/complete\`);
    expect(response.status).toBe(404);
    expect(response.data).toStrictEqual({ error: "TODO not found" });
  });
});

describe("DELETE /todo/:id", () => {
  it("should return with 404 since todo doesn't exist", async () => {
    const response = await axios.delete(\`\${BASE_URL}/todos/999\`);
    expect(response.status).toBe(404);
    expect(response.data).toStrictEqual({ error: "TODO not found" });
  });

  it("deletes the todo with id 1", async () => {
    const response = await axios.delete(\`\${BASE_URL}/todos/1\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({ message: "TODO deleted successfully!" });
  });
});`;

// ─── Test file for Contest 5 (index 5): Car Rental System ───────────
const carRentalTestContent = `${axiosWrapper}

const BASE_URL = "http://localhost:8000";

describe("POST /signup returns the userId", () => {
  it("should fail when sent invalid input", async () => {
    const response = await axios.post(\`\${BASE_URL}/signup\`, {
      username: "Nagmani",
      password: 21
    });
    expect(response.status).toBe(400);
    expect(response.data).toStrictEqual({ message: "invalid data" });
  });

  it("should fail when trying to signup twice with the same username", async () => {
    const response1 = await axios.post(\`\${BASE_URL}/signup\`, {
      username: "Nagmani",
      password: "itsboy"
    });
    expect(response1.status).toBe(201);
    expect(response1.data).toStrictEqual({ message: "User created successfully", userId: 1 });

    const response2 = await axios.post(\`\${BASE_URL}/signup\`, {
      username: "Nagmani",
      password: "itsboy"
    });
    expect(response2.status).toBe(401);
    expect(response2.data).toStrictEqual({ message: "user already exist" });
  });
});

describe("GET /users should return all the users", () => {
  it("should display all the users", async () => {
    const response = await axios.get(\`\${BASE_URL}/users\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      users: [{
        id: 1,
        username: "Nagmani",
        password: "itsboy",
        bookings: []
      }]
    });
  });
});

describe("POST /bookings/:id", () => {
  it("should create a new booking", async () => {
    const response = await axios.post(\`\${BASE_URL}/bookings/1\`, {
      carName: "mustang",
      days: 2,
      rentPerDay: 20000
    });
    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual({
      message: "mustang booked",
      bookingId: 101,
      totalCost: 40000
    });
  });
});

describe("GET /bookings/:userId", () => {
  it("should return all the bookings of that user", async () => {
    const response = await axios.get(\`\${BASE_URL}/bookings/1\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      bookings: [{
        bookingId: 101,
        carName: "mustang",
        days: 2,
        rentPerDay: 20000,
        status: "booked",
      }]
    });
  });
});

describe("GET /bookings/:userId/:bookingId", () => {
  it("returns a specific booking of a specific user", async () => {
    const response = await axios.get(\`\${BASE_URL}/bookings/1/101\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      bookingId: 101,
      carName: "mustang",
      days: 2,
      rentPerDay: 20000,
      status: "booked",
    });
  });

  it("returns with 404 not found", async () => {
    const response = await axios.get(\`\${BASE_URL}/bookings/1/102\`);
    expect(response.status).toBe(404);
    expect(response.data).toStrictEqual({ message: "booking not found" });
  });
});

describe("PUT /bookings/:userId/:bookingId/status", () => {
  it("should update the booking status", async () => {
    const response = await axios.put(\`\${BASE_URL}/bookings/1/101/status\`, {
      status: "completed"
    });
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({ message: "Status updated successfully" });
  });
});

describe("DELETE /bookings/:userId/:bookingId", () => {
  it("deletes a specific booking for that user", async () => {
    const response = await axios.delete(\`\${BASE_URL}/bookings/1/101\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({ message: "Booking deleted successfully" });
  });
});

describe("GET /summary/:userId", () => {
  it("should show the summary of a user", async () => {
    const response = await axios.get(\`\${BASE_URL}/summary/1\`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      userId: 1,
      username: "Nagmani",
      totalBookings: 0,
      totalAmountSpent: 0
    });
  });
});`;

const NOTION_LINK = "https://www.notion.so/Projects-2ce674d192f88024b3aec88fe8d21dcc?source=copy_link";

export const challengeDatas = [
  // ─── Existing challenge (contest index 0) ───────────────────────────
  {
    title: "Build a Todo API with Database",
    notionLink: NOTION_LINK,
    testFile: testFileContent,
    baseGithubUrl: "https://github.com/Nagmani001/with-database",
    totalTestCases: 2,
    contestIndex: 0,
  },
  // ─── Everlasting contest challenges ─────────────────────────────────
  {
    title: "Build a File System & Express HTTP Server",
    notionLink: "https://www.notion.so/Assignment-Express-Server-File-System-FS-2a1fd88043d48135bb0fe78035e16531",
    testFile: fileSystemTestContent,
    baseGithubUrl: "https://github.com/Nagmani001/filesystem-challenge",
    totalTestCases: 13,
    contestIndex: 3,
  },
  {
    title: "Build a Todo CRUD Backend",
    notionLink: "https://www.notion.so/Assignment-3-Build-a-Basic-TODO-Backend-2a3fd88043d481be8024ec4cf8303d87",
    testFile: todoTestContent,
    baseGithubUrl: "https://github.com/Nagmani001/todo-challenge",
    totalTestCases: 10,
    contestIndex: 4,
  },
  {
    title: "Build a Car Rental Booking System",
    notionLink: "https://www.notion.so/Assignment-Build-a-Car-Rental-System-Backend-2a8fd88043d481ee84bed424d21e2997",
    testFile: carRentalTestContent,
    baseGithubUrl: "https://github.com/Nagmani001/car-rental-challenge",
    totalTestCases: 10,
    contestIndex: 5,
  },
];
