import prisma from "@repo/db/client";
import { hashPassword } from "better-auth/crypto";

interface User {
  email: string,
  password: string,
  username: string
}

export async function createUser({ email, username, password }: User) {
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: username,
      username,
      email,
      emailVerified: true
    }
  });
  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      issuer: "local:credential",
      password: hashedPassword,
      userId: user.id
    }
  });
}
