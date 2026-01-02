export const signupInvalidInputs = [
  {
    statement: "missing username",
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "missing email",
    username: "nagmani",
    password: "12345",
  },
  {
    statement: "missing password",
    username: "nagmani",
    email: "n@gmail.com",
  },

  {
    statement: "username is undefined",
    username: undefined,
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "email is undefined",
    username: "nagmani",
    email: undefined,
    password: "12345",
  },
  {
    statement: "password is undefined",
    username: "nagmani",
    email: "n@gmail.com",
    password: undefined,
  },
  {
    statement: "username is null",
    username: null,
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "email is null",
    username: "nagmani",
    email: null,
    password: "12345",
  },
  {
    statement: "password is null",
    username: "nagmani",
    email: "n@gmail.com",
    password: null,
  },

  {
    statement: "username is a number",
    username: 123,
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "email is a number",
    username: "nagmani",
    email: 123,
    password: "12345",
  },
  {
    statement: "password is a number",
    username: "nagmani",
    email: "n@gmail.com",
    password: 12345,
  },
  {
    statement: "username is boolean",
    username: true,
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "email is object",
    username: "nagmani",
    email: {},
    password: "12345",
  },
  {
    statement: "password is array",
    username: "nagmani",
    email: "n@gmail.com",
    password: [],
  },

  {
    statement: "empty username",
    username: "",
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "empty email",
    username: "nagmani",
    email: "",
    password: "12345",
  },
  {
    statement: "empty password",
    username: "nagmani",
    email: "n@gmail.com",
    password: "",
  },

  {
    statement: "username only whitespace",
    username: "   ",
    email: "n@gmail.com",
    password: "12345",
  },
  {
    statement: "email only whitespace",
    username: "nagmani",
    email: "   ",
    password: "12345",
  },
  {
    statement: "password only whitespace",
    username: "nagmani",
    email: "n@gmail.com",
    password: "     ",
  },

  {
    statement: "password too short (4 chars)",
    username: "nagmani",
    email: "n@gmail.com",
    password: "1234",
  },
  {
    statement: "password too long (16 chars)",
    username: "nagmani",
    email: "n@gmail.com",
    password: "1234567890123456",
  },

  {
    statement: "invalid email - no @",
    username: "nagmani",
    email: "nagmanigmail.com",
    password: "12345",
  },
  {
    statement: "invalid email - no domain",
    username: "nagmani",
    email: "nagmani@",
    password: "12345",
  },
  {
    statement: "invalid email - no username",
    username: "nagmani",
    email: "@gmail.com",
    password: "12345",
  },
  {
    statement: "invalid email - double @@",
    username: "nagmani",
    email: "na@@gmail.com",
    password: "12345",
  },
  {
    statement: "invalid email - spaces",
    username: "nagmani",
    email: "na g@gmail.com",
    password: "12345",
  },
  {
    statement: "invalid email - leading space",
    username: "nagmani",
    email: " nagmani@gmail.com",
    password: "12345",
  },
  {
    statement: "invalid email - trailing space",
    username: "nagmani",
    email: "nagmani@gmail.com ",
    password: "12345",
  },
  {
    statement: "empty object",
  },
  {
    statement: "null payload",
    payload: null,
  },
  {
    statement: "array instead of object",
    payload: [],
  },
];

export const signinInvalidInputs = [
  {
    statement: "missing email",
    password: "password123",
  },
  {
    statement: "missing password",
    email: "test@example.com",
  },
  {
    statement: "email is null",
    email: null,
    password: "password123",
  },
  {
    statement: "password is null",
    email: "test@example.com",
    password: null,
  },
  {
    statement: "invalid email format",
    email: "not-an-email",
    password: "password123",
  },
  {
    statement: "password too short",
    email: "test@example.com",
    password: "123",
  },
  {
    statement: "password too long",
    email: "test@example.com",
    password: "p".repeat(16),
  },
  {
    statement: "empty email",
    email: "",
    password: "password123",
  },
  {
    statement: "empty password",
    email: "test@example.com",
    password: "",
  },
  {
    statement: "password only spaces",
    email: "test@example.com",
    password: "     ",
  }
];
